import { Router, type IRouter } from "express";
import {
  PaymentModel,
  UserModel,
  WalletModel,
  WalletTransactionModel,
  docToPlain,
  parseObjectId,
} from "@workspace/db";
import { authMiddleware } from "../lib/auth";

const router: IRouter = Router();

router.get("/payments/summary", authMiddleware, async (_req, res): Promise<void> => {
  const [revenueAgg, commissionAgg, refundAgg, successCount, failedCount, refundedCount] = await Promise.all([
    PaymentModel.aggregate([{ $match: { status: "success" } }, { $group: { _id: null, sum: { $sum: "$amount" } } }]),
    PaymentModel.aggregate([{ $match: { status: "success" } }, { $group: { _id: null, sum: { $sum: "$commissionAmount" } } }]),
    PaymentModel.aggregate([{ $match: { status: "refunded" } }, { $group: { _id: null, sum: { $sum: "$amount" } } }]),
    PaymentModel.countDocuments({ status: "success" }),
    PaymentModel.countDocuments({ status: "failed" }),
    PaymentModel.countDocuments({ status: "refunded" }),
  ]);
  res.json({
    totalRevenue: revenueAgg[0]?.sum ?? 0,
    totalCommission: commissionAgg[0]?.sum ?? 0,
    totalRefunds: refundAgg[0]?.sum ?? 0,
    successCount,
    failedCount,
    refundedCount,
  });
});

router.get("/payments", authMiddleware, async (req, res): Promise<void> => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const status = req.query.status as string | undefined;
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = {};
  if (status) filter.status = status;

  const [total, payments] = await Promise.all([
    PaymentModel.countDocuments(filter),
    PaymentModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);

  const enriched = await Promise.all(
    payments.map(async (p: any) => {
      const plain = docToPlain(p);
      const userDoc = p.userId ? await UserModel.findById(p.userId).select("name").lean() : null;
      return { ...plain, userName: (userDoc as any)?.name ?? null };
    }),
  );
  res.json({ data: enriched, total, page, limit });
});

router.get("/payments/:id", authMiddleware, async (req, res): Promise<void> => {
  const oid = parseObjectId(req.params.id as string);
  if (!oid) { res.status(400).json({ error: "Invalid id" }); return; }
  const payment = await PaymentModel.findById(oid).lean();
  if (!payment) { res.status(404).json({ error: "Payment not found" }); return; }
  const userDoc = (payment as any).userId ? await UserModel.findById((payment as any).userId).select("name").lean() : null;
  res.json({ ...docToPlain(payment), userName: (userDoc as any)?.name ?? null });
});

router.post("/payments/:id/refund", authMiddleware, async (req, res): Promise<void> => {
  const oid = parseObjectId(req.params.id as string);
  if (!oid) { res.status(400).json({ error: "Invalid id" }); return; }
  const payment = await PaymentModel.findById(oid).lean();
  if (!payment) { res.status(404).json({ error: "Payment not found" }); return; }
  const updated = await PaymentModel.findByIdAndUpdate(
    oid,
    { $set: { status: "refunded", refundId: `REF${Date.now()}` } },
    { new: true },
  ).lean();
  const userId = (payment as any).userId;
  if (userId) {
    const userDoc = await UserModel.findById(userId).lean();
    if (userDoc) {
      const newBalance = ((userDoc as any).walletBalance ?? 0) + (payment as any).amount;
      await UserModel.findByIdAndUpdate(userId, { $set: { walletBalance: newBalance } });
      let walletDoc = await WalletModel.findOne({ userId }).lean();
      if (!walletDoc) {
        walletDoc = await WalletModel.create({ userId, balance: newBalance, isFrozen: false });
      } else {
        walletDoc = await WalletModel.findOneAndUpdate({ userId }, { $set: { balance: newBalance } }, { new: true }).lean();
      }
      await WalletTransactionModel.create({
        walletId: (walletDoc as any)._id,
        type: "credit",
        amount: (payment as any).amount,
        balance: newBalance,
        description: "Payment refund",
      });
    }
  }
  const userDoc = userId ? await UserModel.findById(userId).select("name").lean() : null;
  res.json({ ...docToPlain(updated), userName: (userDoc as any)?.name ?? null });
});

export default router;
