import { Request, Response } from 'express';
import Product from '../models/Product';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, buildPaginationMeta } from '../utils/apiResponse';

export const searchProducts = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query.q as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // The Product model has a compound text index on title, description, brand, category
    const filter: any = {};

    if (query) {
        // Perform full-text search and score matches
        filter.$text = { $search: query };
    }

    // Also support explicit category/brand filtering alongside full text search
    if (req.query.category) filter.category = req.query.category;
    if (req.query.brand) filter.brand = req.query.brand;

    const sortOption: any = query ? { score: { $meta: 'textScore' } } : { createdAt: -1 };

    const [products, total] = await Promise.all([
        Product.find(filter, query ? { score: { $meta: 'textScore' } } : {})
            .sort(sortOption)
            .skip(skip)
            .limit(limit),
        Product.countDocuments(filter),
    ]);

    const pagination = buildPaginationMeta(total, page, limit);

    sendSuccess(res, products, 'Search results fetched successfully', 200, pagination);
});
