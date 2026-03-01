import { Request, Response } from 'express';
import Review from '../models/Review';
import Product from '../models/Product';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middleware/authenticate';
import mongoose from 'mongoose';

export const getProductReviews = asyncHandler(async (req: Request, res: Response) => {
    const { productId } = req.params;

    const reviews = await Review.find({ productId })
        .populate('userId', 'name avatar') // Only include name and avatar of the reviewer
        .sort({ createdAt: -1 });

    sendSuccess(res, reviews, 'Reviews fetched successfully');
});

export const addReview = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { productId, rating, comment } = req.body;
    const userId = req.user!.id;

    const product = await Product.findById(productId);
    if (!product) throw new AppError('Product not found', 404);

    const existingReview = await Review.findOne({ userId, productId });
    if (existingReview) throw new AppError('You have already reviewed this product', 400);

    const filter = { productId: new mongoose.Types.ObjectId(productId) };

    // Calculate new rating transactionally or atomically.
    // We'll insert the review and then aggregate overall product rating.
    const review = await Review.create({
        userId,
        productId,
        rating,
        comment,
    });

    const stats = await Review.aggregate([
        { $match: filter },
        {
            $group: {
                _id: '$productId',
                avgRating: { $avg: '$rating' },
                count: { $sum: 1 },
            },
        },
    ]);

    if (stats.length > 0) {
        product.rating = Math.round(stats[0].avgRating * 10) / 10;
        product.reviewCount = stats[0].count;
    } else {
        product.rating = rating;
        product.reviewCount = 1;
    }

    await product.save();
    await review.populate('userId', 'name avatar');

    sendSuccess(res, review, 'Review added successfully', 201);
});
