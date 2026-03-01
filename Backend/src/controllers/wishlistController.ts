import { Request, Response } from 'express';
import Wishlist from '../models/Wishlist';
import Product from '../models/Product';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middleware/authenticate';

export const getWishlist = asyncHandler(async (req: AuthRequest, res: Response) => {
    const wishlist = await Wishlist.find({ userId: req.user!.id })
        .populate('productId')
        .sort({ createdAt: -1 });

    sendSuccess(res, wishlist, 'Wishlist fetched successfully');
});

export const addToWishlist = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { productId } = req.body;

    const product = await Product.findById(productId);
    if (!product) throw new AppError('Product not found', 404);

    const existing = await Wishlist.findOne({ userId: req.user!.id, productId });
    if (existing) throw new AppError('Product already in wishlist', 400);

    const wishlistItem = await Wishlist.create({
        userId: req.user!.id,
        productId,
    });

    await wishlistItem.populate('productId');
    sendSuccess(res, wishlistItem, 'Added to wishlist', 201);
});

export const removeFromWishlist = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { productId } = req.params;

    const deleted = await Wishlist.findOneAndDelete({
        userId: req.user!.id,
        productId,
    });

    if (!deleted) throw new AppError('Item not found in wishlist', 404);

    sendSuccess(res, null, 'Removed from wishlist');
});
