import { Router, type IRouter } from "express";
import { WalletModel, WalletTransactionModel, UserModel, docToPlain, parseObjectId } from "@workspace/db";
import { authMiddleware } from "../lib/auth";

const router: IRouter = Router();

router.get("/wallets", authMiddleware, async (req, res): Promise<void> => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const frozen = req.query.frozen as string | undefined;
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = {};
  if (frozen !== undefined) filter.isFrozen = frozen === "true";

  const [total, wallets] = await Promise.all([
    WalletModel.countDocuments(filter),
    WalletModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);

  const enriched = await Promise.all(
    wallets.map(async (w: any) => {
      const plain = docToPlain(w);
      const userDoc = w.userId ? await UserModel.findById(w.userId).select("name phone").lean() : null;
      return {
        ...plain,
        userName: (userDoc as any)?.name ?? "Unknown",
        userPhone: (userDoc as any)?.phone ?? null,
      };
    }),
  );
  res.json({ data: enriched, total, page, limit });
});

router.get("/wallets/:id", authMiddleware, async (req, res): Promise<void> => {
  const oid = parseObjectId(req.params.id as string);
  if (!oid) { res.status(400).json({ error: "Invalid id" }); return; }
  const wallet = await WalletModel.findById(oid).lean();
  if (!wallet) { res.status(404).json({ error: "Wallet not found" }); return; }
  const userDoc = (wallet as any).userId ? await UserModel.findById((wallet as any).userId).select("name phone").lean() : null;
  res.json({
    ...docToPlain(wallet),
    userName: (userDoc as any)?.name ?? "Unknown",
    userPhone: (userDoc as any)?.phone ?? null,
  });
});

router.post("/wallets/:id/freeze", authMiddleware, async (req, res): Promise<void> => {
  const oid = parseObjectId(req.params.id as string);
  if (!oid) { res.status(400).json({ error: "Invalid id" }); return; }
  const { frozen } = req.body;
  const updated = await WalletModel.findByIdAndUpdate(oid, { $set: { isFrozen: !!frozen } }, { new: true }).lean();
  if (!updated) { res.status(404).json({ error: "Wallet not found" }); return; }
  const userDoc = (updated as any).userId ? await UserModel.findById((updated as any).userId).select("name phone").lean() : null;
  res.json({
    ...docToPlain(updated),
    userName: (userDoc as any)?.name ?? "Unknown",
    userPhone: (userDoc as any)?.phone ?? null,
  });
});

router.get("/wallets/:id/transactions", authMiddleware, async (req, res): Promise<void> => {
  const oid = parseObjectId(req.params.id as string);
  if (!oid) { res.status(400).json({ error: "Invalid id" }); return; }
  const txs = await WalletTransactionModel.find({ walletId: oid }).sort({ createdAt: -1 }).limit(50).lean();
  res.json({ data: txs.map(docToPlain), total: txs.length, page: 1, limit: 50 });
});

export default router;
