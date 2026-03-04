import { Schema, model, Document, Types } from "mongoose";

export interface IPriceHistory extends Document {
  productId: Types.ObjectId;
  price: number;
  recordedAt: Date;
}

const priceHistorySchema = new Schema<IPriceHistory>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    price: {
      type: Number,
      required: true,
      min: [0, "Price cannot be negative"],
    },
    recordedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: false },
);

// compound index for fast range queries by product and date
priceHistorySchema.index({ productId: 1, recordedAt: 1 });

export default model<IPriceHistory>("PriceHistory", priceHistorySchema);
