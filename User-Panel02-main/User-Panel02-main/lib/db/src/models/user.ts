import mongoose, { Schema, type Document, type Model } from "mongoose";
import { randomUUID } from "crypto";

export interface IUser extends Document {
  _id: string;
  id: string;
  firebaseUid: string;
  phone: string;
  name: string | null;
  email: string | null;
  photo: string | null;
  role: string;
  walletBalance: number;
  isDriver: boolean;
  driverStatus: string | null;
  pushToken: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    _id: { type: String, default: () => randomUUID() },
    firebaseUid: { type: String, default: null, unique: true, sparse: true, index: true },
    phone: { type: String, default: "" },
    name: { type: String, default: null },
    email: { type: String, default: null },
    photo: { type: String, default: null },
    role: { type: String, default: "passenger" },
    walletBalance: { type: Number, default: 0 },
    isDriver: { type: Boolean, default: false },
    driverStatus: { type: String, default: null },
    pushToken: { type: String, default: null },
  },
  {
    timestamps: true,
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

export const User: Model<IUser> =
  (mongoose.models["User"] as Model<IUser>) ??
  mongoose.model<IUser>("User", UserSchema);
