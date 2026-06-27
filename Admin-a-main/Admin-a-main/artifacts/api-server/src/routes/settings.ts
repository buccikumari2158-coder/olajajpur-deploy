import { Router, type IRouter } from "express";
import { AppSettingsModel, BannerModel, AnnouncementModel, docToPlain, parseObjectId } from "@workspace/db";
import { authMiddleware } from "../lib/auth";

const router: IRouter = Router();

router.get("/settings/public", async (_req, res): Promise<void> => {
  let raw = await AppSettingsModel.findOne().lean();
  if (!raw) {
    const created = await AppSettingsModel.create({});
    raw = (created as any).toObject();
  }
  const plain = docToPlain(raw);
  res.json({
    appName: plain.appName,
    appLogoUrl: plain.appLogoUrl,
    privacyPolicyUrl: plain.privacyPolicyUrl,
    termsUrl: plain.termsUrl,
    maintenanceMode: plain.maintenanceMode,
  });
});

router.get("/settings", authMiddleware, async (_req, res): Promise<void> => {
  let raw = await AppSettingsModel.findOne().lean();
  if (!raw) {
    const created = await AppSettingsModel.create({});
    raw = (created as any).toObject();
  }
  res.json(docToPlain(raw));
});

router.patch("/settings", authMiddleware, async (req, res): Promise<void> => {
  const fields = ["appName", "appLogoUrl", "supportNumber", "commissionPercent", "maintenanceMode", "registrationEnabled", "privacyPolicyUrl", "termsUrl"];
  const updates: Record<string, any> = {};
  for (const f of fields) {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  }
  const settings = await AppSettingsModel.findOneAndUpdate({}, { $set: updates }, { upsert: true, new: true }).lean();
  res.json(docToPlain(settings));
});

router.get("/content/banners", authMiddleware, async (_req, res): Promise<void> => {
  const banners = await BannerModel.find().sort({ order: 1 }).lean();
  res.json(banners.map(docToPlain));
});

router.post("/content/banners", authMiddleware, async (req, res): Promise<void> => {
  const { title, imageUrl, linkUrl, isActive, order } = req.body;
  if (!title || !imageUrl) { res.status(400).json({ error: "Title and imageUrl required" }); return; }
  const banner = await BannerModel.create({ title, imageUrl, linkUrl, isActive: isActive ?? true, order: order ?? 0 });
  res.status(201).json(docToPlain(banner.toObject()));
});

router.patch("/content/banners/:id", authMiddleware, async (req, res): Promise<void> => {
  const oid = parseObjectId(req.params.id as string);
  if (!oid) { res.status(400).json({ error: "Invalid id" }); return; }
  const fields = ["title", "imageUrl", "linkUrl", "isActive", "order"];
  const updates: Record<string, any> = {};
  for (const f of fields) {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  }
  const updated = await BannerModel.findByIdAndUpdate(oid, { $set: updates }, { new: true }).lean();
  if (!updated) { res.status(404).json({ error: "Banner not found" }); return; }
  res.json(docToPlain(updated));
});

router.delete("/content/banners/:id", authMiddleware, async (req, res): Promise<void> => {
  const oid = parseObjectId(req.params.id as string);
  if (!oid) { res.status(400).json({ error: "Invalid id" }); return; }
  await BannerModel.findByIdAndDelete(oid);
  res.sendStatus(204);
});

router.get("/content/announcements", authMiddleware, async (_req, res): Promise<void> => {
  const announcements = await AnnouncementModel.find().sort({ createdAt: -1 }).lean();
  res.json(announcements.map(docToPlain));
});

router.post("/content/announcements", authMiddleware, async (req, res): Promise<void> => {
  const { title, content, isActive, expiresAt } = req.body;
  if (!title || !content) { res.status(400).json({ error: "Title and content required" }); return; }
  const a = await AnnouncementModel.create({ title, content, isActive: isActive ?? true, expiresAt: expiresAt ? new Date(expiresAt) : null });
  res.status(201).json(docToPlain(a.toObject()));
});

router.patch("/content/announcements/:id", authMiddleware, async (req, res): Promise<void> => {
  const oid = parseObjectId(req.params.id as string);
  if (!oid) { res.status(400).json({ error: "Invalid id" }); return; }
  const fields = ["title", "content", "isActive"];
  const updates: Record<string, any> = {};
  for (const f of fields) {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  }
  if (req.body.expiresAt !== undefined) updates.expiresAt = req.body.expiresAt ? new Date(req.body.expiresAt) : null;
  const updated = await AnnouncementModel.findByIdAndUpdate(oid, { $set: updates }, { new: true }).lean();
  if (!updated) { res.status(404).json({ error: "Announcement not found" }); return; }
  res.json(docToPlain(updated));
});

router.delete("/content/announcements/:id", authMiddleware, async (req, res): Promise<void> => {
  const oid = parseObjectId(req.params.id as string);
  if (!oid) { res.status(400).json({ error: "Invalid id" }); return; }
  await AnnouncementModel.findByIdAndDelete(oid);
  res.sendStatus(204);
});

export default router;
