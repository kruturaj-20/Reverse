import { Schema, model, Document, Types } from 'mongoose';

export interface IWishlist extends Document {
    userId: Types.ObjectId;
    productId: Types.ObjectId;
    createdAt: Date;
}

const wishlistSchema = new Schema<IWishlist>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        productId: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
    },
    { timestamps: true }
);

// Ensure a user cannot wishlist the same product twice
wishlistSchema.index({ userId: 1, productId: 1 }, { unique: true });

export default model<IWishlist>('Wishlist', wishlistSchema);
