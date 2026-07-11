import mongoose, { Schema, Types } from "mongoose";

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI must be set. Connect your MongoDB database.");
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
}

export function docToPlain(doc: any): any {
  if (!doc) return null;
  const obj: Record<string, any> =
    doc && typeof doc.toObject === "function"
      ? doc.toObject({ virtuals: false })
      : { ...doc };
  if (obj._id !== undefined) {
    obj.id = String(obj._id);
    delete obj._id;
  }
  delete obj.__v;
  return obj;
}

// IDs across this system are strings (UUIDs from the user app). Just validate
// and pass through; the models use String _id so findById(string) works.
export function parseObjectId(id: string): string | null {
  return id && typeof id === "string" ? id : null;
}

// Find a doc by string _id (new app data) OR legacy ObjectId _id (old test
// data). Bypasses mongoose casting via the raw collection for the ObjectId case.
export async function findByAnyId(model: any, id: string): Promise<any> {
  const doc = await model.findById(id).lean();
  if (doc) return doc;
  if (/^[0-9a-fA-F]{24}$/.test(id)) {
    return model.collection.findOne({ _id: new Types.ObjectId(id) });
  }
  return null;
}

// ─── Admin ────────────────────────────────────────────────────────────────────

const AdminSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, default: "admin" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "admins" },
);
export const AdminModel =
  (mongoose.models["Admin"] as mongoose.Model<any>) ??
  mongoose.model("Admin", AdminSchema);

// ─── User ─────────────────────────────────────────────────────────────────────

const UserSchema = new Schema(
  {
    _id: { type: String },
    name: String,
    phone: String,
    email: String,
    photo: String,
    profileImage: String,
    role: String,
    isDriver: Boolean,
    driverStatus: String,
    status: { type: String, default: "active" },
    isVerified: { type: Boolean, default: false },
    isBlockedFromBooking: { type: Boolean, default: false },
    totalRides: { type: Number, default: 0 },
    cancelledRides: { type: Number, default: 0 },
    totalSpending: { type: Number, default: 0 },
    walletBalance: { type: Number, default: 0 },
    fcmToken: String,
    lastActiveAt: Date,
  },
  { timestamps: true, collection: "users", strict: false },
);
export const UserModel =
  (mongoose.models["User"] as mongoose.Model<any>) ??
  mongoose.model("User", UserSchema);

// ─── Driver ───────────────────────────────────────────────────────────────────

const DriverSchema = new Schema(
  {
    _id: { type: String },
    userId: { type: String },
    name: String,
    fullName: String,
    phone: String,
    email: String,
    address: String,
    photo: String,
    profileImage: String,
    driverPhotoUrl: String,
    licenseUrl: String,
    aadhaarUrl: String,
    vehicleRcUrl: String,
    vehiclePhotoUrl: String,
    vehicleModel: String,
    status: { type: String, default: "pending" },
    approvalStatus: { type: String, default: "pending" },
    isOnline: { type: Boolean, default: false },
    vehicleType: { type: String, default: "auto" },
    vehicleNumber: String,
    totalRides: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    currentLat: Number,
    currentLng: Number,
    currentLatitude: Number,
    currentLongitude: Number,
    fcmToken: String,
    lastActiveAt: Date,
  },
  { timestamps: true, collection: "drivers", strict: false },
);
export const DriverModel =
  (mongoose.models["Driver"] as mongoose.Model<any>) ??
  mongoose.model("Driver", DriverSchema);

// ─── Driver Document ──────────────────────────────────────────────────────────

const DriverDocumentSchema = new Schema(
  {
    driverId: { type: String },
    documentType: { type: String, required: true },
    fileUrl: String,
    status: { type: String, default: "pending" },
    rejectionReason: String,
    verifiedAt: Date,
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "driver_documents", strict: false },
);
export const DriverDocumentModel =
  (mongoose.models["DriverDocument"] as mongoose.Model<any>) ??
  mongoose.model("DriverDocument", DriverDocumentSchema);

// ─── Ride ─────────────────────────────────────────────────────────────────────

const RideSchema = new Schema(
  {
    _id: { type: String },
    status: { type: String, default: "pending" },
    userId: { type: String },
    passengerId: { type: String },
    driverId: { type: String },
    pickupAddress: String,
    dropAddress: String,
    pickupLat: Number,
    pickupLng: Number,
    dropLat: Number,
    dropLng: Number,
    pickupLatitude: Number,
    pickupLongitude: Number,
    dropLatitude: Number,
    dropLongitude: Number,
    fare: { type: Number, default: 0 },
    distance: { type: Number, default: 0 },
    duration: Number,
    vehicleType: String,
    paymentMethod: { type: String, default: "cash" },
    paymentStatus: { type: String, default: "pending" },
    rating: Number,
    cancelledBy: String,
    cancellationReason: String,
    startedAt: Date,
    completedAt: Date,
  },
  { timestamps: true, collection: "rides", strict: false },
);
export const RideModel =
  (mongoose.models["Ride"] as mongoose.Model<any>) ??
  mongoose.model("Ride", RideSchema);

// ─── Payment ──────────────────────────────────────────────────────────────────

const PaymentSchema = new Schema(
  {
    rideId: { type: String },
    userId: { type: String },
    driverId: { type: String },
    amount: { type: Number, default: 0 },
    commissionAmount: { type: Number, default: 0 },
    driverAmount: { type: Number, default: 0 },
    status: { type: String, default: "pending" },
    method: { type: String, default: "cash" },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    refundId: String,
  },
  { timestamps: true, collection: "payments", strict: false },
);
export const PaymentModel =
  (mongoose.models["Payment"] as mongoose.Model<any>) ??
  mongoose.model("Payment", PaymentSchema);

// ─── Wallet ───────────────────────────────────────────────────────────────────

const WalletSchema = new Schema(
  {
    userId: { type: String },
    balance: { type: Number, default: 0 },
    isFrozen: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "wallets", strict: false },
);
export const WalletModel =
  (mongoose.models["Wallet"] as mongoose.Model<any>) ??
  mongoose.model("Wallet", WalletSchema);

// ─── Wallet Transaction ───────────────────────────────────────────────────────

const WalletTransactionSchema = new Schema(
  {
    walletId: { type: Schema.Types.ObjectId, required: true, ref: "Wallet" },
    type: { type: String, required: true },
    amount: { type: Number, required: true },
    balance: { type: Number, default: 0 },
    description: { type: String, required: true },
    referenceId: Schema.Types.ObjectId,
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "wallet_transactions" },
);
export const WalletTransactionModel =
  (mongoose.models["WalletTransaction"] as mongoose.Model<any>) ??
  mongoose.model("WalletTransaction", WalletTransactionSchema);

// ─── Notification ─────────────────────────────────────────────────────────────

const NotificationSchema = new Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    targetAudience: { type: String, required: true },
    type: { type: String, required: true },
    targetIds: { type: [String], default: [] },
    sentCount: { type: Number, default: 0 },
    imageUrl: String,
    scheduledAt: Date,
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "notifications" },
);
export const NotificationModel =
  (mongoose.models["Notification"] as mongoose.Model<any>) ??
  mongoose.model("Notification", NotificationSchema);

// ─── Promo ────────────────────────────────────────────────────────────────────

const PromoSchema = new Schema(
  {
    code: { type: String, required: true, unique: true },
    description: String,
    discountType: { type: String, required: true },
    discountValue: { type: Number, required: true },
    minimumFare: Number,
    maximumDiscount: Number,
    usageLimit: Number,
    usedCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    expiresAt: Date,
  },
  { timestamps: true, collection: "promos" },
);
export const PromoModel =
  (mongoose.models["Promo"] as mongoose.Model<any>) ??
  mongoose.model("Promo", PromoSchema);

// ─── Support Ticket ───────────────────────────────────────────────────────────

const SupportTicketSchema = new Schema(
  {
    userId: { type: String },
    driverId: { type: String },
    rideId: { type: String },
    reporterName: String,
    reporterPhone: String,
    subject: { type: String, required: true },
    description: String,
    category: { type: String, required: true },
    status: { type: String, default: "open" },
    adminReply: String,
    resolvedAt: Date,
  },
  { timestamps: true, collection: "support_tickets", strict: false },
);
export const SupportTicketModel =
  (mongoose.models["SupportTicket"] as mongoose.Model<any>) ??
  mongoose.model("SupportTicket", SupportTicketSchema);

// ─── App Settings ─────────────────────────────────────────────────────────────

const AppSettingsSchema = new Schema(
  {
    appName: { type: String, default: "JAJPUR JATRI" },
    appLogoUrl: String,
    supportNumber: { type: String, default: "+919583789411" },
    commissionPercent: { type: Number, default: 20 },
    maintenanceMode: { type: Boolean, default: false },
    registrationEnabled: { type: Boolean, default: true },
    privacyPolicyUrl: String,
    termsUrl: String,
  },
  { timestamps: { createdAt: false, updatedAt: true }, collection: "app_settings" },
);
export const AppSettingsModel =
  (mongoose.models["AppSettings"] as mongoose.Model<any>) ??
  mongoose.model("AppSettings", AppSettingsSchema);

// ─── Pricing Settings ─────────────────────────────────────────────────────────

const PricingSettingsSchema = new Schema(
  {
    basePerKm: { type: Number, default: 15 },
    minimumFare: { type: Number, default: 30 },
    maximumFare: { type: Number, default: 500 },
    nightChargeMultiplier: { type: Number, default: 1.5 },
    nightChargeStartHour: { type: Number, default: 22 },
    nightChargeEndHour: { type: Number, default: 6 },
    waitingChargePerMin: { type: Number, default: 1 },
    cancellationFee: { type: Number, default: 25 },
    serviceRadiusKm: { type: Number, default: 30 },
  },
  { timestamps: { createdAt: false, updatedAt: true }, collection: "pricing_settings" },
);
export const PricingSettingsModel =
  (mongoose.models["PricingSettings"] as mongoose.Model<any>) ??
  mongoose.model("PricingSettings", PricingSettingsSchema);

// ─── Surge Zone ───────────────────────────────────────────────────────────────

const SurgeZoneSchema = new Schema(
  {
    name: { type: String, required: true },
    multiplier: { type: Number, default: 1.5 },
    startTime: String,
    endTime: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "surge_zones" },
);
export const SurgeZoneModel =
  (mongoose.models["SurgeZone"] as mongoose.Model<any>) ??
  mongoose.model("SurgeZone", SurgeZoneSchema);

// ─── Service Area ─────────────────────────────────────────────────────────────

const ServiceAreaSchema = new Schema(
  {
    name: { type: String, required: true },
    radiusKm: { type: Number, default: 30 },
    centerLat: { type: Number, required: true },
    centerLng: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "service_areas" },
);
export const ServiceAreaModel =
  (mongoose.models["ServiceArea"] as mongoose.Model<any>) ??
  mongoose.model("ServiceArea", ServiceAreaSchema);

// ─── Activity Log ─────────────────────────────────────────────────────────────

const ActivityLogSchema = new Schema(
  {
    type: { type: String, required: true },
    message: { type: String, required: true },
    metadata: Schema.Types.Mixed,
    timestamp: { type: Date, default: Date.now },
  },
  { collection: "activity_log" },
);
export const ActivityLogModel =
  (mongoose.models["ActivityLog"] as mongoose.Model<any>) ??
  mongoose.model("ActivityLog", ActivityLogSchema);

// ─── Banner ───────────────────────────────────────────────────────────────────

const BannerSchema = new Schema(
  {
    title: { type: String, required: true },
    imageUrl: { type: String, required: true },
    linkUrl: String,
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "banners" },
);
export const BannerModel =
  (mongoose.models["Banner"] as mongoose.Model<any>) ??
  mongoose.model("Banner", BannerSchema);

// ─── Announcement ─────────────────────────────────────────────────────────────

const AnnouncementSchema = new Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    expiresAt: Date,
  },
  { timestamps: true, collection: "announcements" },
);
export const AnnouncementModel =
  (mongoose.models["Announcement"] as mongoose.Model<any>) ??
  mongoose.model("Announcement", AnnouncementSchema);
