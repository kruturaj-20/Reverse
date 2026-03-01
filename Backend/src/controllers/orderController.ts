import { Request, Response } from 'express';
import Order from '../models/Order';
import Cart from '../models/Cart';
import Product from '../models/Product';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middleware/authenticate';
import mongoose from 'mongoose';

export const placeOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { shippingAddress } = req.body;
    const userId = req.user!.id;

    const cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart || cart.items.length === 0) {
        throw new AppError('Cart is empty', 400);
    }

    // Use a transaction if replica set is available, but for simplicity we do sequential updates
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const orderItems = [];
        let totalAmount = 0;

        for (const item of cart.items) {
            const product = await Product.findById(item.productId).session(session);

            if (!product) {
                throw new AppError(`Product not found`, 404);
            }

            if (product.stock < item.quantity) {
                throw new AppError(`Not enough stock for ${product.title}`, 400);
            }

            // Decrement stock
            product.stock -= item.quantity;
            await product.save({ session });

            orderItems.push({
                productId: product._id,
                title: product.title,
                price: product.price, // capture current price
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
            paymentStatus: 'pending', // In a real app, logic for payment processing would go here
            orderStatus: 'pending',
        });

        await order.save({ session });

        // Clear the cart
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

export const getOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orders = await Order.find({ userId: req.user!.id }).sort({ createdAt: -1 });
    sendSuccess(res, orders, 'Orders fetched successfully');
});

export const getOrderById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user!.id });
    if (!order) throw new AppError('Order not found', 404);
    sendSuccess(res, order, 'Order fetched successfully');
});
