import { Router, type IRouter } from "express";
import { PromoModel, docToPlain, parseObjectId } from "@workspace/db";
import { authMiddleware } from "../lib/auth";

const router: IRouter = Router();

router.get("/promos", authMiddleware, async (req, res): Promise<void> => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const skip = (page - 1) * limit;
  const [total, promos] = await Promise.all([
    PromoModel.countDocuments(),
    PromoModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);
  res.json({ data: promos.map(docToPlain), total, page, limit });
});

router.post("/promos", authMiddleware, async (req, res): Promise<void> => {
  const { code, description, discountType, discountValue, minimumFare, maximumDiscount, usageLimit, isActive, expiresAt } = req.body;
  if (!code || !discountType || discountValue === undefined) { res.status(400).json({ error: "Code, discountType, and discountValue required" }); return; }
  const promo = await PromoModel.create({
    code: code.toUpperCase(),
    description,
    discountType,
    discountValue,
    minimumFare,
    maximumDiscount,
    usageLimit,
    isActive: isActive ?? true,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
  });
  res.status(201).json(docToPlain(promo.toObject()));
});

router.get("/promos/:id", authMiddleware, async (req, res): Promise<void> => {
  const oid = parseObjectId(req.params.id as string);
  if (!oid) { res.status(400).json({ error: "Invalid id" }); return; }
  const promo = await PromoModel.findById(oid).lean();
  if (!promo) { res.status(404).json({ error: "Promo not found" }); return; }
  res.json(docToPlain(promo));
});

router.patch("/promos/:id", authMiddleware, async (req, res): Promise<void> => {
  const oid = parseObjectId(req.params.id as string);
  if (!oid) { res.status(400).json({ error: "Invalid id" }); return; }
  const fields = ["code", "description", "discountType", "discountValue", "minimumFare", "maximumDiscount", "usageLimit", "isActive"];
  const updates: Record<string, any> = {};
  for (const f of fields) {
    if (req.body[f] !== undefined) updates[f] = f === "code" ? req.body[f].toUpperCase() : req.body[f];
  }
  if (req.body.expiresAt !== undefined) updates.expiresAt = req.body.expiresAt ? new Date(req.body.expiresAt) : null;
  const updated = await PromoModel.findByIdAndUpdate(oid, { $set: updates }, { new: true }).lean();
  if (!updated) { res.status(404).json({ error: "Promo not found" }); return; }
  res.json(docToPlain(updated));
});

router.delete("/promos/:id", authMiddleware, async (req, res): Promise<void> => {
  const oid = parseObjectId(req.params.id as string);
  if (!oid) { res.status(400).json({ error: "Invalid id" }); return; }
  await PromoModel.findByIdAndDelete(oid);
  res.sendStatus(204);
});

export default router;
