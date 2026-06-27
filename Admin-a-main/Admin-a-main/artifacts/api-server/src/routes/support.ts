import { Router, type IRouter } from "express";
import { SupportTicketModel, docToPlain, parseObjectId } from "@workspace/db";
import { authMiddleware } from "../lib/auth";

const router: IRouter = Router();

router.get("/support/stats", authMiddleware, async (_req, res): Promise<void> => {
  const [open, inProgress, resolved, closed, total] = await Promise.all([
    SupportTicketModel.countDocuments({ status: "open" }),
    SupportTicketModel.countDocuments({ status: "in_progress" }),
    SupportTicketModel.countDocuments({ status: "resolved" }),
    SupportTicketModel.countDocuments({ status: "closed" }),
    SupportTicketModel.countDocuments(),
  ]);
  res.json({ open, inProgress, resolved, closed, total });
});

router.get("/support", authMiddleware, async (req, res): Promise<void> => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const status = req.query.status as string | undefined;
  const category = req.query.category as string | undefined;
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = {};
  if (status) filter.status = status;
  if (category) filter.category = category;

  const [total, tickets] = await Promise.all([
    SupportTicketModel.countDocuments(filter),
    SupportTicketModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);
  res.json({ data: tickets.map(docToPlain), total, page, limit });
});

router.post("/support", authMiddleware, async (req, res): Promise<void> => {
  const { userId, driverId, rideId, subject, description, category } = req.body;
  if (!subject || !category) { res.status(400).json({ error: "Subject and category required" }); return; }
  const ticket = await SupportTicketModel.create({
    userId: userId ? parseObjectId(userId) : undefined,
    driverId: driverId ? parseObjectId(driverId) : undefined,
    rideId: rideId ? parseObjectId(rideId) : undefined,
    subject,
    description,
    category,
    status: "open",
  });
  res.status(201).json(docToPlain(ticket.toObject()));
});

router.get("/support/:id", authMiddleware, async (req, res): Promise<void> => {
  const oid = parseObjectId(req.params.id as string);
  if (!oid) { res.status(400).json({ error: "Invalid id" }); return; }
  const ticket = await SupportTicketModel.findById(oid).lean();
  if (!ticket) { res.status(404).json({ error: "Ticket not found" }); return; }
  res.json(docToPlain(ticket));
});

router.patch("/support/:id", authMiddleware, async (req, res): Promise<void> => {
  const oid = parseObjectId(req.params.id as string);
  if (!oid) { res.status(400).json({ error: "Invalid id" }); return; }
  const { status, adminReply } = req.body;
  const updates: Record<string, any> = {};
  if (status !== undefined) {
    updates.status = status;
    if (status === "resolved" || status === "closed") updates.resolvedAt = new Date();
  }
  if (adminReply !== undefined) updates.adminReply = adminReply;
  const updated = await SupportTicketModel.findByIdAndUpdate(oid, { $set: updates }, { new: true }).lean();
  if (!updated) { res.status(404).json({ error: "Ticket not found" }); return; }
  res.json(docToPlain(updated));
});

export default router;
