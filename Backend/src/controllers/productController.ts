import { Request, Response } from 'express';
import Product from '../models/Product';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, buildPaginationMeta } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';

// ─── Controllers ─────────────────────────────────────────────────────────────

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    // Cap limit at 100 to prevent full-collection scraping/DoS
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
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

    // Sorting — only allow known safe sort options (no arbitrary field injection)
    type SortOption = { [key: string]: 1 | -1 };
    const SORT_OPTIONS: Record<string, SortOption> = {
        price_asc: { price: 1 },
        price_desc: { price: -1 },
        rating: { rating: -1 },
        newest: { createdAt: -1 },
    };
    const sortOption: SortOption = SORT_OPTIONS[req.query.sort as string] ?? { createdAt: -1 };

    const [products, total] = await Promise.all([
        Product.find(filter).sort(sortOption).skip(skip).limit(limit),
        Product.countDocuments(filter),
    ]);

    const pagination = buildPaginationMeta(total, page, limit);
    sendSuccess(res, products, 'Products fetched successfully', 200, pagination);
});

export const getProductById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // Handle Affiliate/Mock/RapidAPI IDs which are not MongoDB ObjectIDs
    if (id.startsWith('af_') || id.startsWith('amz_') || id.startsWith('fk_')) {
        // Find in mock pool
        const { searchAffiliateProducts } = await import('../services/affiliateService');
        // Hack: trigger an empty search to extract the mock pool directly
        const affiliateProducts = await searchAffiliateProducts({ keywords: [], rawQuery: '' }, 50);
        const product = affiliateProducts.find(p => p.id === id);

        if (!product) {
            // It's a live RapidAPI product. Since we don't have caching yet, returning 
            // a synthesized basic product prevents the UI crash. The frontend already has 
            // the full product in memory from the search results anyway.
            sendSuccess(res, {
                id,
                name: 'Live Affiliate Product',
                brand: 'External Store',
                images: [],
                price: 0,
                originalPrice: 0,
                discount: 0,
                category: 'general',
                tags: [],
                rating: 0,
                reviews: 0,
                primaryStore: 'external',
                description: 'This is a live product from an external store. Click Buy Now to view details.',
                storePrices: []
            }, 'Basic affiliate product synthesized');
            return;
        }

        sendSuccess(res, product, 'Affiliate product fetched successfully');
        return;
    }

    const product = await Product.findById(id);
    if (!product) throw new AppError('Product not found', 404);
    sendSuccess(res, product, 'Product fetched successfully');
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
    // Destructure only known fields — prevents mass assignment attacks
    const { title, description, price, originalPrice, category, brand, stock, images } = req.body;
    const product = await Product.create({ title, description, price, originalPrice, category, brand, stock, images });
    sendSuccess(res, product, 'Product created successfully', 201);
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    // Destructure only known fields — prevents mass assignment attacks
    const { title, description, price, originalPrice, category, brand, stock, images } = req.body;
    const product = await Product.findByIdAndUpdate(
        id,
        { title, description, price, originalPrice, category, brand, stock, images },
        { new: true, runValidators: true }
    );
    if (!product) throw new AppError('Product not found', 404);
    sendSuccess(res, product, 'Product updated successfully');
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);
    if (!product) throw new AppError('Product not found', 404);
    sendSuccess(res, null, 'Product deleted successfully', 200);
});
