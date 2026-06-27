import { Router, type IRouter } from "express";
import { PricingSettingsModel, SurgeZoneModel, ServiceAreaModel, docToPlain, parseObjectId } from "@workspace/db";
import { authMiddleware } from "../lib/auth";

const router: IRouter = Router();

router.get("/pricing", authMiddleware, async (_req, res): Promise<void> => {
  let settings = await PricingSettingsModel.findOne().lean();
  if (!settings) {
    const created = await PricingSettingsModel.create({});
    settings = created.toObject ? created.toObject() : created;
  }
  res.json(docToPlain(settings));
});

router.patch("/pricing", authMiddleware, async (req, res): Promise<void> => {
  const fields = ["basePerKm", "minimumFare", "maximumFare", "nightChargeMultiplier", "nightChargeStartHour", "nightChargeEndHour", "waitingChargePerMin", "cancellationFee", "serviceRadiusKm"];
  const updates: Record<string, any> = {};
  for (const f of fields) {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  }
  const settings = await PricingSettingsModel.findOneAndUpdate({}, { $set: updates }, { upsert: true, new: true }).lean();
  res.json(docToPlain(settings));
});

router.get("/pricing/surge-zones", authMiddleware, async (_req, res): Promise<void> => {
  const zones = await SurgeZoneModel.find().sort({ createdAt: -1 }).lean();
  res.json(zones.map(docToPlain));
});

router.post("/pricing/surge-zones", authMiddleware, async (req, res): Promise<void> => {
  const { name, multiplier, startTime, endTime, isActive } = req.body;
  const zone = await SurgeZoneModel.create({ name, multiplier, startTime, endTime, isActive: isActive ?? true });
  res.status(201).json(docToPlain(zone.toObject()));
});

router.patch("/pricing/surge-zones/:id", authMiddleware, async (req, res): Promise<void> => {
  const oid = parseObjectId(req.params.id as string);
  if (!oid) { res.status(400).json({ error: "Invalid id" }); return; }
  const fields = ["name", "multiplier", "startTime", "endTime", "isActive"];
  const updates: Record<string, any> = {};
  for (const f of fields) {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  }
  const updated = await SurgeZoneModel.findByIdAndUpdate(oid, { $set: updates }, { new: true }).lean();
  if (!updated) { res.status(404).json({ error: "Surge zone not found" }); return; }
  res.json(docToPlain(updated));
});

router.delete("/pricing/surge-zones/:id", authMiddleware, async (req, res): Promise<void> => {
  const oid = parseObjectId(req.params.id as string);
  if (!oid) { res.status(400).json({ error: "Invalid id" }); return; }
  await SurgeZoneModel.findByIdAndDelete(oid);
  res.sendStatus(204);
});

router.get("/service-areas", authMiddleware, async (_req, res): Promise<void> => {
  const areas = await ServiceAreaModel.find().sort({ createdAt: -1 }).lean();
  res.json(areas.map(docToPlain));
});

router.post("/service-areas", authMiddleware, async (req, res): Promise<void> => {
  const { name, radiusKm, centerLat, centerLng, isActive } = req.body;
  const area = await ServiceAreaModel.create({ name, radiusKm, centerLat, centerLng, isActive: isActive ?? true });
  res.status(201).json(docToPlain(area.toObject()));
});

router.patch("/service-areas/:id", authMiddleware, async (req, res): Promise<void> => {
  const oid = parseObjectId(req.params.id as string);
  if (!oid) { res.status(400).json({ error: "Invalid id" }); return; }
  const fields = ["name", "radiusKm", "centerLat", "centerLng", "isActive"];
  const updates: Record<string, any> = {};
  for (const f of fields) {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  }
  const updated = await ServiceAreaModel.findByIdAndUpdate(oid, { $set: updates }, { new: true }).lean();
  if (!updated) { res.status(404).json({ error: "Service area not found" }); return; }
  res.json(docToPlain(updated));
});

router.delete("/service-areas/:id", authMiddleware, async (req, res): Promise<void> => {
  const oid = parseObjectId(req.params.id as string);
  if (!oid) { res.status(400).json({ error: "Invalid id" }); return; }
  await ServiceAreaModel.findByIdAndDelete(oid);
  res.sendStatus(204);
});

export default router;
