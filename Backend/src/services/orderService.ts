/**
 * Order Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Extracts the shared cart → order-item mapping logic that was duplicated
 * between placeOrder (COD) and checkout (Razorpay) controllers.
 *
 * I3 fix: Single source of truth for order item construction.
 */

import mongoose from 'mongoose';
import Product from '../models/Product';
import Cart from '../models/Cart';
import { AppError } from '../utils/AppError';

export interface OrderItemInput {
    productId: mongoose.Types.ObjectId;
    title: string;
    price: number;
    quantity: number;
    imageUrl: string;
}

export interface CartToOrderResult {
    orderItems: OrderItemInput[];
    totalAmount: number;
}

/**
 * Fetches the user's cart, validates stock for each item, and builds the order
 * item array. Does NOT mutate the cart or decrement stock — that is the
 * responsibility of the calling controller (within a Mongoose session/transaction).
 *
 * @param userId  - The authenticated user's ID
 * @param session - Optional Mongoose ClientSession for transactional reads
 */
export const buildOrderItemsFromCart = async (
    userId: string,
    session?: mongoose.ClientSession
): Promise<CartToOrderResult> => {
    const cartQuery = Cart.findOne({ userId });
    if (session) cartQuery.session(session);
    const cart = await cartQuery;

    if (!cart || cart.items.length === 0) {
        throw new AppError('Cart is empty', 400);
    }

    // Batch-fetch ALL products in ONE query — eliminates N+1
    const productIds = cart.items.map(i => i.productId);
    const productsQuery = Product.find({ _id: { $in: productIds }, isDeleted: { $ne: true } });
    if (session) productsQuery.session(session);
    const products = await productsQuery;

    const productMap = new Map(products.map(p => [p._id.toString(), p]));

    const orderItems: OrderItemInput[] = [];
    let totalAmount = 0;

    for (const item of cart.items) {
        const product = productMap.get(item.productId.toString());
        if (!product) {
            throw new AppError(`Product not found or has been removed`, 404);
        }
        if (product.stock < item.quantity) {
            throw new AppError(
                `Insufficient stock for "${product.title}". Available: ${product.stock}, Requested: ${item.quantity}.`,
                400
            );
        }

        orderItems.push({
            productId: product._id as mongoose.Types.ObjectId,
            title: product.title,
            price: product.price,        // Price snapshot at checkout time — immutable
            quantity: item.quantity,
            imageUrl: product.images[0] || '',
        });

        totalAmount += product.price * item.quantity;
    }

    return { orderItems, totalAmount };
};

/**
 * Atomically decrements stock for each order item within a provided session.
 * Throws if any item has insufficient stock (race-condition guard).
 */
export const decrementStock = async (
    items: OrderItemInput[],
    session: mongoose.ClientSession
): Promise<void> => {
    const productIds = items.map(i => i.productId);
    const products = await Product.find({ _id: { $in: productIds } }).session(session);
    const productMap = new Map(products.map(p => [p._id.toString(), p]));

    for (const item of items) {
        const product = productMap.get(item.productId.toString());
        if (!product) {
            throw new AppError(`Product not found during stock update`, 404);
        }
        if (product.stock < item.quantity) {
            throw new AppError(
                `Insufficient stock for "${item.title}". This may be due to another concurrent order. Please contact support.`,
                409
            );
        }
        product.stock -= item.quantity;
        await product.save({ session });
    }
};
