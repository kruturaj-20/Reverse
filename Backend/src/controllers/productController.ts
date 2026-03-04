import { Request, Response } from "express";
import Product from "../models/Product";
import PriceHistory from "../models/PriceHistory";
import Wishlist from "../models/Wishlist";
import SearchLog from "../models/SearchLog";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess, buildPaginationMeta } from "../utils/apiResponse";
import { AppError } from "../utils/AppError";
import { cache, hashQuery, CacheTTL } from "../utils/cache";
import logger from "../utils/logger";
import { sendPriceDropNotification } from "../utils/notification";
import { searchAffiliateProducts } from "../services/affiliateService";

// ─── Controllers ─────────────────────────────────────────────────────────────

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  // Cap limit at 100 to prevent full-collection scraping/DoS
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
  const skip = (page - 1) * limit;

  // Filtering — always exclude soft-deleted products
  const filter: any = { isDeleted: { $ne: true } };
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
  const sortOption: SortOption = SORT_OPTIONS[req.query.sort as string] ?? {
    createdAt: -1,
  };

  // ─── Cache check ───────────────────────────────────────────────────────────
  const cacheKey = `products:list:${hashQuery({ filter, sortOption, page, limit })}`;
  const cached = await cache.get(cacheKey);
  if (cached) {
    res.status(200).json(JSON.parse(cached));
    return;
  }

  const [products, total] = await Promise.all([
    Product.find(filter).sort(sortOption).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);

  // compute AI pick badge id for this page (only when there are results)
  let aiPickId: string | null = null;
  if (products.length) {
    let bestScore = Infinity;
    products.forEach((p) => {
      // rating fallback to 1 to avoid zero
      const score = (p.price || 0) / (p.rating || 1);
      if (score < bestScore) {
        bestScore = score;
        aiPickId = p.id || p._id.toString();
      }
    });
  }

  const pagination = buildPaginationMeta(total, page, limit);
  const responseBody = {
    success: true,
    data: products,
    aiPickId,
    message: "Products fetched successfully",
    pagination,
  };

  // Cache the full response for 5 minutes
  await cache.set(
    cacheKey,
    JSON.stringify(responseBody),
    CacheTTL.PRODUCT_LIST,
  );
  logger.debug(`[cache] Products list cached with key: ${cacheKey}`);

  sendSuccess(res, products, "Products fetched successfully", 200, pagination);
});

export const getProductById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    // Handle Affiliate/Mock/RapidAPI IDs which are not MongoDB ObjectIDs
    if (id.startsWith("af_") || id.startsWith("amz_") || id.startsWith("fk_")) {
      const { searchAffiliateProducts } =
        await import("../services/affiliateService");
      const affiliateProducts = await searchAffiliateProducts(
        { keywords: [id], rawQuery: id },
        50,
      );
      const product = affiliateProducts.find((p) => p.id === id);

      if (!product) {
        sendSuccess(
          res,
          {
            id,
            name: "Live Affiliate Product",
            brand: "External Store",
            images: [],
            price: 0,
            originalPrice: 0,
            discount: 0,
            category: "general",
            tags: [],
            rating: 0,
            reviews: 0,
            primaryStore: "external",
            description:
              "This is a live product from an external store. Click Buy Now to view details.",
            storePrices: [],
          },
          "Affiliate product stub returned",
        );
        return;
      }

      sendSuccess(res, product, "Affiliate product fetched successfully");
      return;
    }

    // ─── Cache check for DB products ────────────────────────────────────
    const cacheKey = `products:id:${id}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      res.status(200).json(JSON.parse(cached));
      return;
    }

    const product = await Product.findOne({
      _id: id,
      isDeleted: { $ne: true },
    });
    if (!product) throw new AppError("Product not found", 404);

    const responseBody = {
      success: true,
      data: product,
      message: "Product fetched successfully",
    };
    await cache.set(
      cacheKey,
      JSON.stringify(responseBody),
      CacheTTL.PRODUCT_DETAIL,
    );

    sendSuccess(res, product, "Product fetched successfully");
  },
);

export const createProduct = asyncHandler(
  async (req: Request, res: Response) => {
    // Destructure only known fields — prevents mass assignment attacks
    const {
      title,
      description,
      price,
      originalPrice,
      category,
      brand,
      stock,
      images,
    } = req.body;
    const product = await Product.create({
      title,
      description,
      price,
      originalPrice,
      category,
      brand,
      stock,
      images,
    });

    // record initial price
    await PriceHistory.create({ productId: product._id, price: product.price });

    sendSuccess(res, product, "Product created successfully", 201);
  },
);

export const updateProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    // Destructure only known fields — prevents mass assignment attacks
    const {
      title,
      description,
      price,
      originalPrice,
      category,
      brand,
      stock,
      images,
    } = req.body;

    // fetch old price for comparison
    const existing = await Product.findById(id);
    if (!existing) throw new AppError("Product not found", 404);
    const oldPrice = existing.price;

    const product = await Product.findByIdAndUpdate(
      id,
      {
        title,
        description,
        price,
        originalPrice,
        category,
        brand,
        stock,
        images,
      },
      { new: true, runValidators: true },
    );

    // if price changed, record history and check alerts
    if (product && price !== undefined && price !== oldPrice) {
      await PriceHistory.create({ productId: id, price });

      // find wishlist items that care about this product and have a target price >= new price
      const watchers = await Wishlist.find({
        productId: id,
        targetPrice: { $ne: null, $lte: price },
      });
      for (const w of watchers) {
        // only notify once per drop (if not already notified recently)
        if (
          !w.notifiedAt ||
          w.notifiedAt < new Date(Date.now() - 24 * 60 * 60 * 1000)
        ) {
          await sendPriceDropNotification(
            w.userId.toString(),
            id,
            price,
            w.targetPrice!,
          );
          w.notifiedAt = new Date();
          await w.save();
        }
      }
    }

    // Invalidate cached data for this product and product lists
    await cache.del(`products:id:${id}`);
    logger.debug(`[cache] Invalidated product cache for ${id}`);

    sendSuccess(res, product, "Product updated successfully");
  },
);

export const deleteProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    // Soft-delete — preserves referential integrity for existing orders
    const product = await Product.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      { isDeleted: true },
      { new: true },
    );
    if (!product) throw new AppError("Product not found", 404);

    // Invalidate caches
    await cache.del(`products:id:${id}`);
    logger.debug(`[cache] Invalidated product cache for deleted product ${id}`);

    sendSuccess(res, null, "Product deleted successfully", 200);
  },
);

// ---------- additional endpoints for price intelligence ----------

export const getBudgetBundle = asyncHandler(
  async (req: Request, res: Response) => {
    const { budget, categories } = req.body as {
      budget: number;
      categories: string[];
    };
    // fetch cheapest item for each category
    const results = await Promise.all(
      categories.map((cat) =>
        Product.find({ category: cat, isDeleted: { $ne: true } })
          .sort({ price: 1 })
          .limit(1),
      ),
    );
    const bundle = results.map((r) => r[0]).filter((p) => p);
    const total = bundle.reduce((sum, p) => sum + (p?.price || 0), 0);
    if (total > budget) {
      throw new AppError("Unable to create bundle within budget", 400);
    }

    sendSuccess(res, { bundle, total }, "Budget bundle created successfully");
  },
);

// simple personalized feed based on last search query
export const getPersonalizedFeed = asyncHandler(
  async (req: Request, res: Response) => {
    // user must be authenticated for personalization
    const userId = (req as any).user?.id;
    if (!userId) throw new AppError("Authentication required", 401);

    // get recent searches
    const recent = await SearchLog.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5);
    let seedQuery = recent.length ? recent[0].query : "";

    // if we have multiple logs, we could pick most frequent term
    if (recent.length > 1) {
      const tokenCounts: Record<string, number> = {};
      recent.forEach((l: any) => {
        l.query.split(/\s+/).forEach((tok: string) => {
          const t = tok.toLowerCase().replace(/[^a-z0-9]/g, "");
          if (t.length > 2) tokenCounts[t] = (tokenCounts[t] || 0) + 1;
        });
      });
      const sorted = Object.entries(tokenCounts).sort((a, b) => b[1] - a[1]);
      if (sorted.length) seedQuery = sorted[0][0];
    }

    // reuse affiliate search pipeline for personalized recommendations
    const products = seedQuery
      ? await searchAffiliateProducts(
          { keywords: [seedQuery], rawQuery: seedQuery },
          20,
        )
      : [];

    sendSuccess(res, products, "Personalized home feed");
  },
);

export const getBundleSuggestions = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) throw new AppError("Product not found", 404);

    const suggestions = await Product.find({
      category: product.category,
      _id: { $ne: id },
      isDeleted: { $ne: true },
    })
      .sort({ price: 1 })
      .limit(3);

    sendSuccess(res, suggestions, "Bundle suggestions fetched");
  },
);

export const getPriceHistory = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) throw new AppError("Product not found", 404);

    const history = await PriceHistory.find({ productId: id }).sort({
      recordedAt: 1,
    });
    sendSuccess(res, history, "Price history fetched successfully");
  },
);

export const getBuyAdvice = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) throw new AppError("Product not found", 404);

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const stats = await PriceHistory.aggregate([
      { $match: { productId: product._id, recordedAt: { $gte: since } } },
      {
        $group: {
          _id: null,
          minPrice: { $min: "$price" },
          avgPrice: { $avg: "$price" },
        },
      },
    ]);

    let advice: "buy_now" | "wait" | "expensive" = "buy_now";
    if (stats.length > 0) {
      const { minPrice, avgPrice } = stats[0] as any;
      if (product.price <= minPrice) advice = "buy_now";
      else if (product.price >= avgPrice * 1.1) advice = "expensive";
      else advice = "wait";
    }

    sendSuccess(res, { advice }, "Buy advice computed");
  },
);
