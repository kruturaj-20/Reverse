import { Request, Response } from 'express';
import Order from '../models/Order';
import Cart from '../models/Cart';
import Product from '../models/Product';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middleware/authenticate';
import mongoose from 'mongoose';
import { config } from '../config';
import crypto from 'crypto';
import Razorpay from 'razorpay';

// Helper to create razorpay client lazily (so config is already loaded)
let _razorpayClient: Razorpay | null = null;
function getRazorpayClient(): Razorpay {
    if (!_razorpayClient) {
        _razorpayClient = new Razorpay({
            key_id: config.razorpayKeyId,
            key_secret: config.razorpayKeySecret,
        });
    }
    return _razorpayClient;
}

export const placeOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
    // Legacy COD-style order: deducts stock immediately
    const { shippingAddress } = req.body;
    const userId = req.user!.id;

    const cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0) {
        throw new AppError('Cart is empty', 400);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Batch-fetch ALL products in one query — eliminates N+1
        const productIds = cart.items.map(i => i.productId);
        const products = await Product.find({ _id: { $in: productIds } }).session(session);
        const productMap = new Map(products.map(p => [p._id.toString(), p]));

        const orderItems: {
            productId: mongoose.Types.ObjectId;
            title: string;
            price: number;
            quantity: number;
            imageUrl: string;
        }[] = [];
        let totalAmount = 0;

        for (const item of cart.items) {
            const product = productMap.get(item.productId.toString());
            if (!product) throw new AppError(`Product not found`, 404);
            if (product.stock < item.quantity) {
                throw new AppError(`Not enough stock for ${product.title}`, 400);
            }
            product.stock -= item.quantity;
            await product.save({ session });

            orderItems.push({
                productId: product._id as mongoose.Types.ObjectId,
                title: product.title,
                price: product.price,        // Price snapshot at order time
                quantity: item.quantity,
                imageUrl: product.images[0] || '',
            });
            totalAmount += product.price * item.quantity;
        }

        const order = new Order({
            userId,
            items: orderItems,
            totalAmount,
            shippingAddress,
            paymentStatus: 'pending',
            orderStatus: 'pending',
        });

        await order.save({ session });

        cart.items = [];
        cart.totalPrice = 0;
        await cart.save({ session });

        await session.commitTransaction();
        session.endSession();

        sendSuccess(res, order, 'Order placed successfully', 201);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
});

// Create a Razorpay order and return payment payload to the client.
// Stock is NOT decremented here — only validated. Decrement happens in verifyPayment
// after the payment signature is confirmed, preventing phantom stock loss on payment failure.
export const checkout = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { shippingAddress } = req.body;
    const userId = req.user!.id;

    const cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0) {
        throw new AppError('Cart is empty', 400);
    }

    // Batch-fetch ALL products in one query — eliminates N+1
    const productIds = cart.items.map(i => i.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map(p => [p._id.toString(), p]));

    const orderItems: {
        productId: mongoose.Types.ObjectId;
        title: string;
        price: number;
        quantity: number;
        imageUrl: string;
    }[] = [];
    let totalAmount = 0;

    for (const item of cart.items) {
        const product = productMap.get(item.productId.toString());
        if (!product) throw new AppError(`Product not found`, 404);
        if (product.stock < item.quantity) {
            throw new AppError(`Not enough stock for ${product.title}`, 400);
        }

        orderItems.push({
            productId: product._id as mongoose.Types.ObjectId,
            title: product.title,
            price: product.price,        // Price snapshot at checkout time
            quantity: item.quantity,
            imageUrl: product.images[0] || '',
        });
        totalAmount += product.price * item.quantity;
    }

    // Create Razorpay order
    const rp = getRazorpayClient();
    const razorpayOrder = await rp.orders.create({
        amount: Math.round(totalAmount * 100), // Convert INR to paise
        currency: 'INR',
        payment_capture: true,
    });

    // Persist DB order with razorpayOrderId before responding to client
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const order = new Order({
            userId,
            items: orderItems,
            totalAmount,
            shippingAddress,
            paymentStatus: 'pending',
            orderStatus: 'pending',
            razorpayOrderId: razorpayOrder.id,
        });
        await order.save({ session });
        await session.commitTransaction();
        session.endSession();

        sendSuccess(res, {
            order,
            razorpay: {
                keyId: config.razorpayKeyId,
                orderId: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
            },
        }, 'Order created');
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
});

// Verify Razorpay payment signature, then atomically decrement stock and clear cart.
// This is the ONLY place stock is reduced in the Razorpay flow.
export const verifyPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;
    if (!orderId || !razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
        throw new AppError('Missing payment information', 400);
    }

    // Verify HMAC-SHA256 signature — prevents tampered payment IDs
    const generatedSignature = crypto
        .createHmac('sha256', config.razorpayKeySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

    if (generatedSignature !== razorpaySignature) {
        throw new AppError('Invalid payment signature', 400);
    }

    const order = await Order.findOne({ _id: orderId, userId: req.user!.id });
    if (!order) throw new AppError('Order not found', 404);

    if (order.paymentStatus === 'paid') {
        // Idempotent: already processed (e.g. duplicate webhook)
        sendSuccess(res, order, 'Payment already verified');
        return;
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        // Decrement stock now that payment is confirmed
        const productIds = order.items.map(i => i.productId);
        const products = await Product.find({ _id: { $in: productIds } }).session(session);
        const productMap = new Map(products.map(p => [p._id.toString(), p]));

        for (const item of order.items) {
            const product = productMap.get(item.productId.toString());
            if (!product) throw new AppError(`Product not found during stock update`, 404);
            if (product.stock < item.quantity) {
                // Rare race condition: stock ran out between checkout and payment verification
                throw new AppError(`Insufficient stock for ${item.title}. Please contact support.`, 409);
            }
            product.stock -= item.quantity;
            await product.save({ session });
        }

        // Mark order as paid
        order.paymentStatus = 'paid';
        order.razorpayPaymentId = razorpayPaymentId;
        order.razorpaySignature = razorpaySignature;
        await order.save({ session });

        // Clear the user's cart now that payment is confirmed
        await Cart.findOneAndUpdate(
            { userId: order.userId },
            { $set: { items: [], totalPrice: 0 } },
            { session }
        );

        await session.commitTransaction();
        session.endSession();

        sendSuccess(res, order, 'Payment verified and order confirmed');
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
});

export const getOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orders = await Order.find({ userId: req.user!.id }).sort({ createdAt: -1 });
    sendSuccess(res, orders, 'Orders fetched successfully');
});

export const getOrderById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user!.id });
    if (!order) throw new AppError('Order not found', 404);
    sendSuccess(res, order, 'Order fetched successfully');
});
