import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { parseSearchIntent } from '../services/geminiService';
import { searchAffiliateProducts } from '../services/affiliateService';
import { processImageSearch } from '../services/imageSearchService';
import SearchLog from '../models/SearchLog';
import logger from '../utils/logger';
import { cache, hashQuery, CacheTTL } from '../utils/cache';

/**
 * GET /api/v1/search?q=...&page=1&limit=20&category=...&brand=...&maxPrice=...
 *
 * Pipeline:
 * 1. Gemini parses the natural-language query into structured intent
 * 2. Affiliate service fetches matching products (CueLinks or smart mock fallback)
 * 3. Response includes `aiMeta` with the extracted intent so the frontend can show
 *    "AI understood: running shoes under ₹3000 in footwear"
 */
export const searchProducts = asyncHandler(async (req: Request, res: Response) => {
  const query = (req.query.q as string | undefined) || '';
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

  // Allow manual overrides from query params
  const manualCategory = req.query.category as string | undefined;
  const manualBrand = req.query.brand as string | undefined;
  const manualMaxPrice = req.query.maxPrice ? parseInt(req.query.maxPrice as string) : undefined;
  const manualMinPrice = req.query.minPrice ? parseInt(req.query.minPrice as string) : undefined;

  logger.info(`AI Search: query="${query}"`);
  // persist search log for personalization
  try {
    const authReq = req as AuthRequest;
    if (query && authReq.user?.id) {
      await SearchLog.create({ userId: authReq.user.id, query });
    }
  } catch (e) {
    logger.warn('Failed to save search log', e);
  }

  // Step 1: Parse intent with Gemini
  const intent = query
    ? await parseSearchIntent(query)
    : {
        keywords: [],
        rawQuery: '',
        category: manualCategory,
        brand: manualBrand,
      };

  // Manual overrides take priority over AI-extracted values
  if (manualCategory) intent.category = manualCategory;
  if (manualBrand) intent.brand = manualBrand;
  if (manualMaxPrice) intent.maxPrice = manualMaxPrice;
  if (manualMinPrice) intent.minPrice = manualMinPrice;

  // Step 2: Fetch products
  // caching by intent + page+limit
  const cacheKey = `search:${hashQuery({ intent, page, limit })}`;
  const cached = await cache.get(cacheKey);
  if (cached) {
    res.status(200).json(JSON.parse(cached));
    return;
  }

  const allProducts = await searchAffiliateProducts(intent, limit * page);

  // Pagination (applied in-memory since affiliate APIs may not support it)
  const start = (page - 1) * limit;
  const products = allProducts.slice(start, start + limit);
  const total = allProducts.length;

  const pagination = {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNextPage: start + limit < total,
    hasPrevPage: page > 1,
  };

  const responseBody = {
    success: true,
    data: products,
    message: query ? `AI search results for: "${query}"` : 'Products fetched',
    pagination,
  };

  await cache.set(cacheKey, JSON.stringify(responseBody), CacheTTL.SEARCH_RESULTS);

  sendSuccess(res, products, responseBody.message, 200, pagination);
});

/**
 * POST /api/v1/search/image
 * Body: multipart/form-data with field "image" (file)
 *
 * Pipeline:
 * 1. multer receives the image buffer
 * 2. Gemini Vision analyses the image → product description + keywords
 * 3. Affiliate service fetches matching products
 */
export const imageSearch = asyncHandler(async (req: Request, res: Response) => {
  const file = req.file;

  if (!file) {
    sendError(res, 'Please upload an image file (field name: image)', 400);
    return;
  }

  if (!file.mimetype.startsWith('image/')) {
    sendError(res, 'Only image files are accepted', 400);
    return;
  }

  logger.info(`Image Search: received ${file.originalname} (${file.size} bytes, ${file.mimetype})`);

  const { products, detectedQuery } = await processImageSearch(file.buffer, file.mimetype);

  sendSuccess(res, products, `Found ${products.length} similar products`, 200, {
    total: products.length,
    page: 1,
    limit: products.length,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
});
