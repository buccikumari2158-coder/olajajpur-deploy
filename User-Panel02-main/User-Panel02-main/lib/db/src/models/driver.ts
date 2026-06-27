import mongoose, { Schema, type Document, type Model } from "mongoose";
import { randomUUID } from "crypto";

export interface IDriver extends Document {
  _id: string;
  id: string;
  userId: string;
  vehicleType: string | null;
  vehicleNumber: string | null;
  vehicleModel: string | null;
  address: string | null;
  licenseUrl: string | null;
  aadhaarUrl: string | null;
  vehicleRcUrl: string | null;
  vehiclePhotoUrl: string | null;
  driverPhotoUrl: string | null;
  status: string;
  isOnline: boolean;
  currentLat: number | null;
  currentLng: number | null;
  rating: number;
  ratingCount: number;
  totalRides: number;
  createdAt: Date;
  updatedAt: Date;
}

const DriverSchema = new Schema<IDriver>(
  {
    _id: { type: String, default: () => randomUUID() },
    userId: { type: String, required: true, unique: true, index: true },
    vehicleType: { type: String, default: null },
    vehicleNumber: { type: String, default: null },
    vehicleModel: { type: String, default: null },
    address: { type: String, default: null },
    licenseUrl: { type: String, default: null },
    aadhaarUrl: { type: String, default: null },
    vehicleRcUrl: { type: String, default: null },
    vehiclePhotoUrl: { type: String, default: null },
    driverPhotoUrl: { type: String, default: null },
    status: { type: String, default: "pending" },
    isOnline: { type: Boolean, default: false },
    currentLat: { type: Number, default: null },
    currentLng: { type: Number, default: null },
    rating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    totalRides: { type: Number, default: 0 },
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

export const Driver: Model<IDriver> =
  (mongoose.models["Driver"] as Model<IDriver>) ??
  mongoose.model<IDriver>("Driver", DriverSchema);
