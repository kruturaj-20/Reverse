import { Schema, model, Document, Types } from "mongoose";

export interface IWishlist extends Document {
  userId: Types.ObjectId;
  productId: Types.ObjectId;
  targetPrice?: number; // user-specified alert threshold (in same currency as product.price)
  notifiedAt?: Date; // when alert was last triggered
  createdAt: Date;
}

const wishlistSchema = new Schema<IWishlist>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    targetPrice: {
      type: Number,
      min: [0, "Target price cannot be negative"],
      default: null,
    },
    notifiedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// Ensure a user cannot wishlist the same product twice
wishlistSchema.index({ userId: 1, productId: 1 }, { unique: true });

export default model<IWishlist>("Wishlist", wishlistSchema);
