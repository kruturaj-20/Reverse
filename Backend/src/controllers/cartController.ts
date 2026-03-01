import { Request, Response } from 'express';
import Cart, { ICart } from '../models/Cart';
import Product from '../models/Product';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middleware/authenticate';

const calculateTotal = (cart: ICart) => {
    cart.totalPrice = cart.items.reduce((total, item) => total + item.price * item.quantity, 0);
};

export const getCart = asyncHandler(async (req: AuthRequest, res: Response) => {
    let cart = await Cart.findOne({ userId: req.user!.id }).populate('items.productId');
    if (!cart) {
        cart = await Cart.create({ userId: req.user!.id, items: [], totalPrice: 0 });
    }
    sendSuccess(res, cart, 'Cart fetched successfully');
});

export const addToCart = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { productId, quantity } = req.body;

    const product = await Product.findById(productId);
    if (!product) throw new AppError('Product not found', 404);
    if (product.stock < quantity) throw new AppError('Not enough stock available', 400);

    let cart = await Cart.findOne({ userId: req.user!.id });
    if (!cart) {
        cart = new Cart({ userId: req.user!.id, items: [], totalPrice: 0 });
    }

    const existingItemIndex = cart.items.findIndex((item) => item.productId.toString() === productId);

    if (existingItemIndex > -1) {
        cart.items[existingItemIndex].quantity += quantity;
        // Update price snapshot
        cart.items[existingItemIndex].price = product.price;
    } else {
        cart.items.push({
            productId: product._id,
            quantity,
            price: product.price,
        });
    }

    calculateTotal(cart);
    await cart.save();
    await cart.populate('items.productId');

    sendSuccess(res, cart, 'Added to cart successfully', 200);
});

export const removeFromCart = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { productId } = req.params;

    const cart = await Cart.findOne({ userId: req.user!.id });
    if (!cart) throw new AppError('Cart not found', 404);

    cart.items = cart.items.filter((item) => item.productId.toString() !== productId);
    calculateTotal(cart);

    await cart.save();
    await cart.populate('items.productId');

    sendSuccess(res, cart, 'Removed from cart successfully');
});
