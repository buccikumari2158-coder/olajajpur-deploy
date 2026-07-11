import { Router, type IRouter } from "express";
import {
  UserModel,
  RideModel,
  WalletModel,
  WalletTransactionModel,
  ActivityLogModel,
  docToPlain,
  parseObjectId,
  findByAnyId,
} from "@workspace/db";
import { authMiddleware } from "../lib/auth";

const router: IRouter = Router();

// App users only store phone/name/role/walletBalance/isDriver/driverStatus.
// Fill in the admin-facing fields with sensible defaults.
function enrichUser(u: any) {
  const base = docToPlain(u);
  return {
    ...base,
    // never null — the admin UI calls .toLowerCase()/.includes() on these
    name: base.name ?? base.phone ?? "Unknown",
    phone: base.phone ?? "",
    email: base.email ?? "",
    profileImage: base.photo ?? base.profileImage ?? null,
    status: base.status ?? "active",
    isVerified: base.isVerified ?? true,
    isBlockedFromBooking: base.isBlockedFromBooking ?? false,
    totalRides: base.totalRides ?? 0,
    totalSpending: base.totalSpending ?? 0,
    walletBalance: base.walletBalance ?? 0,
  };
}

router.get("/users", authMiddleware, async (req, res): Promise<void> => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const search = req.query.search as string | undefined;
  const status = req.query.status as string | undefined;
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = {};
  if (search) filter.$or = [{ name: new RegExp(search, "i") }, { phone: new RegExp(search, "i") }];
  if (status) filter.status = status;

  const [total, users] = await Promise.all([
    UserModel.countDocuments(filter),
    UserModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);
  res.json({ data: users.map(enrichUser), total, page, limit });
});

router.get("/users/:id", authMiddleware, async (req, res): Promise<void> => {
  const id = parseObjectId(req.params.id as string);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }
  const userDoc = await findByAnyId(UserModel, id);
  if (!userDoc) { res.status(404).json({ error: "User not found" }); return; }
  const [recentRides, walletDoc] = await Promise.all([
    RideModel.find({ $or: [{ passengerId: id }, { userId: id }] }).sort({ createdAt: -1 }).limit(10).lean(),
    WalletModel.findOne({ userId: id }).lean(),
  ]);
  const walletTransactions = walletDoc
    ? (await WalletTransactionModel.find({ walletId: (walletDoc as any)._id }).sort({ createdAt: -1 }).limit(10).lean()).map(docToPlain)
    : [];
  res.json({ ...enrichUser(userDoc), recentRides: recentRides.map(docToPlain), walletTransactions });
});

router.patch("/users/:id", authMiddleware, async (req, res): Promise<void> => {
  const id = parseObjectId(req.params.id as string);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }
  const { name, email, status, isVerified, isBlockedFromBooking } = req.body;
  const updates: Record<string, any> = {};
  if (name !== undefined) updates.name = name;
  if (email !== undefined) updates.email = email;
  if (status !== undefined) updates.status = status;
  if (isVerified !== undefined) updates.isVerified = isVerified;
  if (isBlockedFromBooking !== undefined) updates.isBlockedFromBooking = isBlockedFromBooking;
  const updated = await UserModel.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
  if (!updated) { res.status(404).json({ error: "User not found" }); return; }
  res.json(enrichUser(updated));
});

router.delete("/users/:id", authMiddleware, async (req, res): Promise<void> => {
  const id = parseObjectId(req.params.id as string);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }
  const deleted = await UserModel.findByIdAndDelete(id).lean();
  if (!deleted) { res.status(404).json({ error: "User not found" }); return; }
  res.sendStatus(204);
});

router.post("/users/:id/action", authMiddleware, async (req, res): Promise<void> => {
  const id = parseObjectId(req.params.id as string);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }
  const { action } = req.body;
  let updates: Record<string, any> = {};
  switch (action) {
    case "ban": updates = { status: "banned" }; break;
    case "unban": updates = { status: "active" }; break;
    case "suspend": updates = { status: "suspended" }; break;
    case "unsuspend": updates = { status: "active" }; break;
    case "verify": updates = { isVerified: true }; break;
    case "block_booking": updates = { isBlockedFromBooking: true }; break;
    case "unblock_booking": updates = { isBlockedFromBooking: false }; break;
    case "force_logout": break;
    case "reset_account": updates = { totalRides: 0, cancelledRides: 0, totalSpending: 0 }; break;
    default: res.status(400).json({ error: "Invalid action" }); return;
  }
  if (Object.keys(updates).length > 0) {
    await UserModel.findByIdAndUpdate(id, { $set: updates });
  }
  await ActivityLogModel.create({ type: "user_action", message: `Admin performed '${action}' on user ${id}` });
  const user = await UserModel.findById(id).lean();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json(enrichUser(user));
});

router.get("/users/:id/rides", authMiddleware, async (req, res): Promise<void> => {
  const id = parseObjectId(req.params.id as string);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }
  const rides = await RideModel.find({ $or: [{ passengerId: id }, { userId: id }] }).sort({ createdAt: -1 }).limit(20).lean();
  res.json({ data: rides.map(docToPlain), total: rides.length, page: 1, limit: 20 });
});

router.post("/users/:id/wallet-adjustment", authMiddleware, async (req, res): Promise<void> => {
  const id = parseObjectId(req.params.id as string);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }
  const { amount, type, reason } = req.body;
  const userDoc = await UserModel.findById(id).lean();
  if (!userDoc) { res.status(404).json({ error: "User not found" }); return; }
  const user = docToPlain(userDoc);
  const delta = type === "credit" ? Math.abs(amount) : -Math.abs(amount);
  const newBalance = (user.walletBalance ?? 0) + delta;
  await UserModel.findByIdAndUpdate(id, { $set: { walletBalance: newBalance } });
  let walletDoc: any = await WalletModel.findOne({ userId: id }).lean();
  if (!walletDoc) {
    walletDoc = await WalletModel.create({ userId: id, balance: newBalance, isFrozen: false });
  } else {
    walletDoc = await WalletModel.findOneAndUpdate({ userId: id }, { $set: { balance: newBalance } }, { new: true }).lean();
  }
  await WalletTransactionModel.create({
    walletId: (walletDoc as any)!._id,
    type,
    amount: Math.abs(amount),
    balance: newBalance,
    description: reason ?? `Admin ${type}`,
  });
  res.json({ userId: id, balance: newBalance });
});

export default router;
