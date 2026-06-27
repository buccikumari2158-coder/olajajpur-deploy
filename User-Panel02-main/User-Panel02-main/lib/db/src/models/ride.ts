import mongoose, { Schema, type Document, type Model } from "mongoose";
import { randomUUID } from "crypto";

export interface IRide extends Document {
  _id: string;
  id: string;
  passengerId: string;
  driverId: string | null;
  pickupLat: number;
  pickupLng: number;
  pickupAddress: string;
  dropLat: number;
  dropLng: number;
  dropAddress: string;
  vehicleType: string;
  paymentMethod: string;
  fare: number;
  distance: number;
  otp: string;
  status: string;
  rating: number | null;
  ratingComment: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const RideSchema = new Schema<IRide>(
  {
    _id: { type: String, default: () => randomUUID() },
    passengerId: { type: String, required: true, index: true },
    driverId: { type: String, default: null, index: true },
    pickupLat: { type: Number, required: true },
    pickupLng: { type: Number, required: true },
    pickupAddress: { type: String, required: true },
    dropLat: { type: Number, required: true },
    dropLng: { type: Number, required: true },
    dropAddress: { type: String, required: true },
    vehicleType: { type: String, required: true },
    paymentMethod: { type: String, default: "cash" },
    fare: { type: Number, required: true },
    distance: { type: Number, required: true },
    otp: { type: String, required: true },
    status: { type: String, default: "searching", index: true },
    rating: { type: Number, default: null },
    ratingComment: { type: String, default: null },
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

export const Ride: Model<IRide> =
  (mongoose.models["Ride"] as Model<IRide>) ??
  mongoose.model<IRide>("Ride", RideSchema);
