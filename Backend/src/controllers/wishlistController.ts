import { Request, Response } from "express";
import Wishlist from "../models/Wishlist";
import Product from "../models/Product";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { AppError } from "../utils/AppError";
import { AuthRequest } from "../middleware/authenticate";

export const getWishlist = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const wishlist = await Wishlist.find({ userId: req.user!.id })
      .populate("productId")
      .sort({ createdAt: -1 });

    // smart grouping: categorize by product category
    const groups: Record<string, any[]> = {};
    wishlist.forEach((item) => {
      const prod: any = item.productId;
      const cat = prod?.category || "other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });

    sendSuccess(res, { wishlist, groups }, "Wishlist fetched successfully");
  },
);
export const addToWishlist = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { productId, targetPrice } = req.body;

    const product = await Product.findById(productId);
    if (!product) throw new AppError("Product not found", 404);

    const existing = await Wishlist.findOne({
      userId: req.user!.id,
      productId,
    });
    if (existing) throw new AppError("Product already in wishlist", 400);

    const wishlistItem = await Wishlist.create({
      userId: req.user!.id,
      productId,
      targetPrice: targetPrice || null,
    });

    await wishlistItem.populate("productId");
    sendSuccess(res, wishlistItem, "Added to wishlist", 201);
  },
);

export const removeFromWishlist = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { productId } = req.params;

    const deleted = await Wishlist.findOneAndDelete({
      userId: req.user!.id,
      productId,
    });

    if (!deleted) throw new AppError("Item not found in wishlist", 404);

    sendSuccess(res, null, "Removed from wishlist");
  },
);

export const updateWishlistTarget = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { productId } = req.params;
    const { targetPrice } = req.body;

    const item = await Wishlist.findOne({ userId: req.user!.id, productId });
    if (!item) throw new AppError("Item not found in wishlist", 404);

    item.targetPrice = targetPrice;
    await item.save();

    await item.populate("productId");
    sendSuccess(res, item, "Wishlist target price updated");
  },
);
