import { Schema, model, Document, Types } from 'mongoose';
import { OrderStatus, PaymentStatus } from './Order';

// Re-export so existing imports from this file continue to work
export type { OrderStatus, PaymentStatus };

export interface IProduct extends Document {
    title: string;
    description: string;
    price: number;
    originalPrice: number;
    discount: number;
    rating: number;
    reviewCount: number;
    images: string[];
    category: string;
    brand: string;
    stock: number;
    isDeleted: boolean;   // Soft-delete flag — never hard-delete products (orders reference them)
    createdAt: Date;
}

const productSchema = new Schema<IProduct>(
    {
        title: {
            type: String,
            required: [true, 'Product title is required'],
            trim: true,
            maxlength: [200, 'Title must not exceed 200 characters'],
        },
        description: {
            type: String,
            required: [true, 'Product description is required'],
            maxlength: [2000, 'Description must not exceed 2000 characters'],
        },
        price: {
            type: Number,
            required: [true, 'Price is required'],
            min: [0, 'Price cannot be negative'],
        },
        originalPrice: {
            type: Number,
            required: [true, 'Original price is required'],
            min: [0, 'Original price cannot be negative'],
        },
        discount: {
            type: Number,
            default: 0,
            min: [0, 'Discount cannot be negative'],
            max: [100, 'Discount cannot exceed 100%'],
        },
        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
        reviewCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        images: {
            type: [String],
            default: [],
        },
        category: {
            type: String,
            required: [true, 'Category is required'],
            trim: true,
            lowercase: true,
        },
        brand: {
            type: String,
            required: [true, 'Brand is required'],
            trim: true,
        },
        stock: {
            type: Number,
            required: [true, 'Stock is required'],
            min: [0, 'Stock cannot be negative'],
            default: 0,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        toJSON: {
            transform: (_doc, ret) => {
                ret.id = ret._id;
                delete (ret as any)._id;
                delete (ret as any).__v;
                delete (ret as any).isDeleted; // Never expose soft-delete flag to clients
                return ret;
            },
        },
    }
);

// Compound indexes for search and filtering
productSchema.index({ title: 'text', description: 'text', brand: 'text', category: 'text' });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ createdAt: -1 });

export default model<IProduct>('Product', productSchema);
