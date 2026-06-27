import mongoose from "mongoose";
import { User } from "./models/user";
import { Driver } from "./models/driver";
import { Ride } from "./models/ride";
import { WalletTransaction } from "./models/walletTransaction";

export { User, Driver, Ride, WalletTransaction };
export type { IUser } from "./models/user";
export type { IDriver } from "./models/driver";
export type { IRide } from "./models/ride";
export type { IWalletTransaction } from "./models/walletTransaction";

let _connected = false;

export async function connectDb(): Promise<void> {
  if (_connected || mongoose.connection.readyState !== 0) {
    _connected = true;
    return;
  }

  const uri =
    process.env["MONGODB_URI"] ??
    process.env["DATABASE_URL"] ??
    "";

  if (!uri) {
    throw new Error(
      "MONGODB_URI must be set. Add it to your server secrets.",
    );
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10_000,
    socketTimeoutMS: 45_000,
  });

  _connected = true;
  console.log("[db] MongoDB connected");
}
