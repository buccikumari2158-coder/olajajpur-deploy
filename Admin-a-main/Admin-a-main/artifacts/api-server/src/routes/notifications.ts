import { Router, type IRouter } from "express";
import { NotificationModel, docToPlain, parseObjectId } from "@workspace/db";
import { authMiddleware } from "../lib/auth";

const router: IRouter = Router();

router.get("/notifications", authMiddleware, async (req, res): Promise<void> => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const skip = (page - 1) * limit;
  const [total, notifications] = await Promise.all([
    NotificationModel.countDocuments(),
    NotificationModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);
  res.json({ data: notifications.map(docToPlain), total, page, limit });
});

router.post("/notifications", authMiddleware, async (req, res): Promise<void> => {
  const { title, message, targetAudience, type, targetIds, imageUrl, scheduledAt } = req.body;
  if (!title || !message) { res.status(400).json({ error: "Title and message required" }); return; }
  const notif = await NotificationModel.create({
    title,
    message,
    targetAudience: targetAudience ?? "all",
    type: type ?? "announcement",
    targetIds: targetIds ?? [],
    sentCount: 1,
    imageUrl: imageUrl ?? null,
    scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
  });
  res.status(201).json(docToPlain(notif.toObject()));
});

router.get("/notifications/:id", authMiddleware, async (req, res): Promise<void> => {
  const oid = parseObjectId(req.params.id as string);
  if (!oid) { res.status(400).json({ error: "Invalid id" }); return; }
  const notif = await NotificationModel.findById(oid).lean();
  if (!notif) { res.status(404).json({ error: "Notification not found" }); return; }
  res.json(docToPlain(notif));
});

router.delete("/notifications/:id", authMiddleware, async (req, res): Promise<void> => {
  const oid = parseObjectId(req.params.id as string);
  if (!oid) { res.status(400).json({ error: "Invalid id" }); return; }
  await NotificationModel.findByIdAndDelete(oid);
  res.sendStatus(204);
});

export default router;
