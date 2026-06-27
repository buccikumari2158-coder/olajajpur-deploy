import mongoose, { Schema, type Document, type Model } from "mongoose";
import { randomUUID } from "crypto";

export interface IWalletTransaction extends Document {
  _id: string;
  id: string;
  userId: string;
  type: string;
  description: string;
  amount: number;
  createdAt: Date;
}

const WalletTransactionSchema = new Schema<IWalletTransaction>(
  {
    _id: { type: String, default: () => randomUUID() },
    userId: { type: String, required: true, index: true },
    type: { type: String, required: true },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
  },
);

export const WalletTransaction: Model<IWalletTransaction> =
  (mongoose.models["WalletTransaction"] as Model<IWalletTransaction>) ??
  mongoose.model<IWalletTransaction>("WalletTransaction", WalletTransactionSchema);
