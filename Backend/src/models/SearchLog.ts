import { Schema, model, Document, Types } from "mongoose";

export interface ISearchLog extends Document {
  userId: Types.ObjectId;
  query: string;
  createdAt: Date;
}

const searchLogSchema = new Schema<ISearchLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    query: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export default model<ISearchLog>("SearchLog", searchLogSchema);
