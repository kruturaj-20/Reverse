import { Schema, model, Document, Types } from 'mongoose';

export interface ICartItem {
    productId: Types.ObjectId;
    quantity: number;
    price: number; // Snapshot of price at time of add
}

export interface ICart extends Document {
    userId: Types.ObjectId;
    items: ICartItem[];
    totalPrice: number;
    updatedAt: Date;
}

const cartItemSchema = new Schema<ICartItem>(
    {
        productId: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: [1, 'Quantity must be at least 1'],
            default: 1,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    { _id: false }
);

const cartSchema = new Schema<ICart>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true, // One cart per user
        },
        items: {
            type: [cartItemSchema],
            default: [],
        },
        totalPrice: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    { timestamps: true }
);

export default model<ICart>('Cart', cartSchema);
