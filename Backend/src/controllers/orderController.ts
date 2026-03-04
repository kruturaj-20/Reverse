import { Response } from 'express';
import Order from '../models/Order';
import Cart from '../models/Cart';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middleware/authenticate';
import mongoose from 'mongoose';
import { config } from '../config';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { buildOrderItemsFromCart, decrementStock } from '../services/orderService';

// ─── Razorpay client (lazy singleton) ────────────────────────────────────────

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

// ─── COD / Legacy Order ───────────────────────────────────────────────────────
// Deducts stock immediately on placement. For Razorpay flow, use checkout + verifyPayment.

export const placeOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { shippingAddress } = req.body;
    const userId = req.user!.id;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Build order items from cart (validates stock inside a transaction)
        const { orderItems, totalAmount } = await buildOrderItemsFromCart(userId, session);

        // Decrement stock atomically
        await decrementStock(orderItems, session);

        const order = new Order({
            userId,
            items: orderItems,
            totalAmount,
            shippingAddress,
            paymentStatus: 'pending',
            orderStatus: 'pending',
        });
        await order.save({ session });

        // Clear cart after successful order
        await Cart.findOneAndUpdate(
            { userId },
            { $set: { items: [], totalPrice: 0 } },
            { session }
        );

        await session.commitTransaction();
        session.endSession();

        sendSuccess(res, order, 'Order placed successfully', 201);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
});

// ─── Razorpay Checkout ────────────────────────────────────────────────────────
// Creates a Razorpay order. Stock is validated but NOT decremented here.
// Decrement happens in verifyPayment after HMAC signature is confirmed,
// preventing phantom stock loss on payment abandonment/failure.

export const checkout = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { shippingAddress } = req.body;
    const userId = req.user!.id;

    // Build order items (no session — we're just reading, not writing stock yet)
    const { orderItems, totalAmount } = await buildOrderItemsFromCart(userId);

    // Create Razorpay order (paise = INR * 100)
    const rp = getRazorpayClient();
    const razorpayOrder = await rp.orders.create({
        amount: Math.round(totalAmount * 100),
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
                // key_id is a publishable key — safe to expose to client per Razorpay docs
                keyId: config.razorpayKeyId,
                orderId: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
            },
        }, 'Checkout initiated');
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
});

// ─── Verify Razorpay Payment ──────────────────────────────────────────────────
// Verifies HMAC-SHA256 signature, then atomically decrements stock and clears cart.
// This is the ONLY place stock is reduced in the Razorpay flow.

export const verifyPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;
    if (!orderId || !razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
        throw new AppError('Missing payment information', 400);
    }

    // Cryptographic signature verification — prevents tampered payment IDs
    const generatedSignature = crypto
        .createHmac('sha256', config.razorpayKeySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

    if (generatedSignature !== razorpaySignature) {
        throw new AppError('Invalid payment signature', 400);
    }

    const order = await Order.findOne({ _id: orderId, userId: req.user!.id });
    if (!order) throw new AppError('Order not found', 404);

    // Idempotency guard — safe to call multiple times (e.g. duplicate webhooks)
    if (order.paymentStatus === 'paid') {
        sendSuccess(res, order, 'Payment already verified');
        return;
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        // Stock decrement — now that payment is confirmed
        await decrementStock(
            order.items.map(i => ({
                productId: i.productId as mongoose.Types.ObjectId,
                title: i.title,
                price: i.price,
                quantity: i.quantity,
                imageUrl: i.imageUrl,
            })),
            session
        );

        // Mark order as paid
        order.paymentStatus = 'paid';
        order.razorpayPaymentId = razorpayPaymentId;
        order.razorpaySignature = razorpaySignature;
        await order.save({ session });

        // Clear user's cart
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

// ─── Read Operations ──────────────────────────────────────────────────────────

export const getOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orders = await Order.find({ userId: req.user!.id }).sort({ createdAt: -1 });
    sendSuccess(res, orders, 'Orders fetched successfully');
});

export const getOrderById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user!.id });
    if (!order) throw new AppError('Order not found', 404);
    sendSuccess(res, order, 'Order fetched successfully');
});
