import { Router } from "express";
import { User, WalletTransaction } from "@workspace/db";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.get("/wallet/balance", requireAuth, async (req, res) => {
  const userId = req.auth!.sub;

  const user = await User.findById(userId).select("walletBalance").lean();
  res.json({ balance: user?.walletBalance ?? 0 });
});

router.get("/wallet/transactions", requireAuth, async (req, res) => {
  const userId = req.auth!.sub;

  const txns = await WalletTransaction.find({ userId })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const transactions = txns.map((t) => ({
    id: t._id,
    userId: t.userId,
    type: t.type,
    description: t.description,
    amount: t.amount,
    createdAt: t.createdAt,
  }));

  res.json({ transactions });
});

export default router;
