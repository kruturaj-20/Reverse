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

// helper to create razorpay client (lazy so config already loaded)
let _razorpayClient: any;
function getRazorpayClient() {
    if (!_razorpayClient) {
        const Razorpay = require('razorpay');
        _razorpayClient = new Razorpay({
            key_id: config.razorpayKeyId,
            key_secret: config.razorpayKeySecret,
        });
    }
    return _razorpayClient;
}

export const placeOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
    // retain legacy behaviour in case somebody hits this endpoint directly
    const { shippingAddress } = req.body;
    const userId = req.user!.id;

    const cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart || cart.items.length === 0) {
        throw new AppError('Cart is empty', 400);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const orderItems: any[] = [];
        let totalAmount = 0;

        for (const item of cart.items) {
            const product = await Product.findById(item.productId).session(session);
            if (!product) throw new AppError(`Product not found`, 404);
            if (product.stock < item.quantity) {
                throw new AppError(`Not enough stock for ${product.title}`, 400);
            }
            product.stock -= item.quantity;
            await product.save({ session });

            orderItems.push({
                productId: product._id,
                title: product.title,
                price: product.price,
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

// new handler: create an order and return razorpay payload
export const checkout = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { shippingAddress } = req.body;
    const userId = req.user!.id;

    const cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart || cart.items.length === 0) {
        throw new AppError('Cart is empty', 400);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const orderItems: any[] = [];
        let totalAmount = 0;

        for (const item of cart.items) {
            const product = await Product.findById(item.productId).session(session);
            if (!product) throw new AppError(`Product not found`, 404);
            if (product.stock < item.quantity) {
                throw new AppError(`Not enough stock for ${product.title}`, 400);
            }
            product.stock -= item.quantity;
            await product.save({ session });

            orderItems.push({
                productId: product._id,
                title: product.title,
                price: product.price,
                quantity: item.quantity,
                imageUrl: product.images[0] || '',
            });
            totalAmount += product.price * item.quantity;
        }

        // create a mongoose order first so we can attach its id to razorpay
        const order = new Order({
            userId,
            items: orderItems,
            totalAmount,
            shippingAddress,
            paymentStatus: 'pending',
            orderStatus: 'pending',
        });
        await order.save({ session });

        // create Razorpay order
        const rp = getRazorpayClient();
        const razorpayOrder = await rp.orders.create({
            amount: Math.round(totalAmount * 100), // convert INR to paise
            currency: 'INR',
            receipt: order._id.toString(),
            payment_capture: 1,
        });

        order.razorpayOrderId = razorpayOrder.id;
        await order.save({ session });

        cart.items = [];
        cart.totalPrice = 0;
        await cart.save({ session });

        await session.commitTransaction();
        session.endSession();

        // return razorpay order + key id for client checkout
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

// verify payment callback from client
export const verifyPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;
    if (!orderId || !razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
        throw new AppError('Missing payment information', 400);
    }

    // verify signature
    const generatedSignature = crypto
        .createHmac('sha256', config.razorpayKeySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

    if (generatedSignature !== razorpaySignature) {
        throw new AppError('Invalid payment signature', 400);
    }

    const order = await Order.findById(orderId);
    if (!order) throw new AppError('Order not found', 404);

    order.paymentStatus = 'paid';
    order.razorpayPaymentId = razorpayPaymentId;
    order.razorpaySignature = razorpaySignature;

    await order.save();

    sendSuccess(res, order, 'Payment verified and order updated');
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
