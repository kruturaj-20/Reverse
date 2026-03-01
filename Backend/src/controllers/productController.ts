import { Request, Response } from 'express';
import Product from '../models/Product';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, buildPaginationMeta } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';

// ─── Controllers ─────────────────────────────────────────────────────────────

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Filtering
    const filter: any = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.brand) filter.brand = req.query.brand;
    if (req.query.minPrice || req.query.maxPrice) {
        filter.price = {};
        if (req.query.minPrice) filter.price.$gte = Number(req.query.minPrice);
        if (req.query.maxPrice) filter.price.$lte = Number(req.query.maxPrice);
    }

    // Sorting
    let sortOption: any = { createdAt: -1 }; // Default: newest
    if (req.query.sort) {
        switch (req.query.sort) {
            case 'price_asc': sortOption = { price: 1 }; break;
            case 'price_desc': sortOption = { price: -1 }; break;
            case 'rating': sortOption = { rating: -1 }; break;
            case 'newest': sortOption = { createdAt: -1 }; break;
        }
    }

    const [products, total] = await Promise.all([
        Product.find(filter).sort(sortOption).skip(skip).limit(limit),
        Product.countDocuments(filter),
    ]);

    const pagination = buildPaginationMeta(total, page, limit);
    sendSuccess(res, products, 'Products fetched successfully', 200, pagination);
});

export const getProductById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) throw new AppError('Product not found', 404);

    sendSuccess(res, product, 'Product fetched successfully');
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
    const product = await Product.create(req.body);
    sendSuccess(res, product, 'Product created successfully', 201);
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const product = await Product.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
    });

    if (!product) throw new AppError('Product not found', 404);
    sendSuccess(res, product, 'Product updated successfully');
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);

    if (!product) throw new AppError('Product not found', 404);
    sendSuccess(res, null, 'Product deleted successfully', 200);
});
