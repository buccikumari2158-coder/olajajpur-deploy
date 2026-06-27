import { Router, type IRouter } from "express";
import {
  DriverModel,
  DriverDocumentModel,
  RideModel,
  ActivityLogModel,
  docToPlain,
  parseObjectId,
} from "@workspace/db";
import { authMiddleware } from "../lib/auth";

const router: IRouter = Router();

router.get("/drivers", authMiddleware, async (req, res): Promise<void> => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const search = req.query.search as string | undefined;
  const status = req.query.status as string | undefined;
  const approvalStatus = req.query.approvalStatus as string | undefined;
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = {};
  if (search) filter.$or = [{ name: new RegExp(search, "i") }, { phone: new RegExp(search, "i") }];
  if (status === "online") filter.isOnline = true;
  else if (status === "offline") filter.isOnline = false;
  else if (status && !["online", "offline"].includes(status)) filter.status = status;
  if (approvalStatus) filter.approvalStatus = approvalStatus;

  const [total, drivers] = await Promise.all([
    DriverModel.countDocuments(filter),
    DriverModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);
  res.json({ data: drivers.map(docToPlain), total, page, limit });
});

router.post("/drivers", authMiddleware, async (req, res): Promise<void> => {
  const { name, phone, email, vehicleType, vehicleNumber } = req.body;
  if (!name || !phone) { res.status(400).json({ error: "Name and phone required" }); return; }
  const driver = await DriverModel.create({ name, phone, email, vehicleType: vehicleType ?? "auto", vehicleNumber });
  res.status(201).json(docToPlain(driver.toObject()));
});

router.get("/drivers/pending-approvals", authMiddleware, async (_req, res): Promise<void> => {
  const drivers = await DriverModel.find({ approvalStatus: "pending" }).sort({ createdAt: -1 }).lean();
  res.json(drivers.map(docToPlain));
});

router.get("/drivers/:id", authMiddleware, async (req, res): Promise<void> => {
  const oid = parseObjectId(req.params.id as string);
  if (!oid) { res.status(400).json({ error: "Invalid id" }); return; }
  const driverDoc = await DriverModel.findById(oid).lean();
  if (!driverDoc) { res.status(404).json({ error: "Driver not found" }); return; }
  const driver = docToPlain(driverDoc);
  const [documents, recentRides] = await Promise.all([
    DriverDocumentModel.find({ driverId: oid }).lean(),
    RideModel.find({ driverId: oid }).sort({ createdAt: -1 }).limit(10).lean(),
  ]);
  res.json({ ...driver, documents: documents.map(docToPlain), recentRides: recentRides.map(docToPlain) });
});

router.patch("/drivers/:id", authMiddleware, async (req, res): Promise<void> => {
  const oid = parseObjectId(req.params.id as string);
  if (!oid) { res.status(400).json({ error: "Invalid id" }); return; }
  const { name, email, vehicleType, vehicleNumber, status, approvalStatus, isOnline } = req.body;
  const updates: Record<string, any> = {};
  if (name !== undefined) updates.name = name;
  if (email !== undefined) updates.email = email;
  if (vehicleType !== undefined) updates.vehicleType = vehicleType;
  if (vehicleNumber !== undefined) updates.vehicleNumber = vehicleNumber;
  if (status !== undefined) updates.status = status;
  if (approvalStatus !== undefined) updates.approvalStatus = approvalStatus;
  if (isOnline !== undefined) updates.isOnline = isOnline;
  const updated = await DriverModel.findByIdAndUpdate(oid, { $set: updates }, { new: true }).lean();
  if (!updated) { res.status(404).json({ error: "Driver not found" }); return; }
  res.json(docToPlain(updated));
});

router.delete("/drivers/:id", authMiddleware, async (req, res): Promise<void> => {
  const oid = parseObjectId(req.params.id as string);
  if (!oid) { res.status(400).json({ error: "Invalid id" }); return; }
  const deleted = await DriverModel.findByIdAndDelete(oid).lean();
  if (!deleted) { res.status(404).json({ error: "Driver not found" }); return; }
  res.sendStatus(204);
});

router.post("/drivers/:id/action", authMiddleware, async (req, res): Promise<void> => {
  const oid = parseObjectId(req.params.id as string);
  if (!oid) { res.status(400).json({ error: "Invalid id" }); return; }
  const { action } = req.body;
  let updates: Record<string, any> = {};
  switch (action) {
    case "approve": updates = { approvalStatus: "approved" }; break;
    case "reject": updates = { approvalStatus: "rejected" }; break;
    case "suspend": updates = { status: "suspended" }; break;
    case "unsuspend": updates = { status: "active" }; break;
    case "ban": updates = { status: "banned" }; break;
    case "unban": updates = { status: "active" }; break;
    case "force_offline": updates = { isOnline: false }; break;
    case "enable_requests":
    case "disable_requests":
    case "send_notification": break;
    default: res.status(400).json({ error: "Invalid action" }); return;
  }
  if (Object.keys(updates).length > 0) {
    await DriverModel.findByIdAndUpdate(oid, { $set: updates });
  }
  await ActivityLogModel.create({ type: "driver_action", message: `Admin performed '${action}' on driver ${req.params.id}` });
  const driver = docToPlain(await DriverModel.findById(oid).lean());
  if (!driver) { res.status(404).json({ error: "Driver not found" }); return; }
  res.json(driver);
});

router.post("/drivers/:id/verify-document", authMiddleware, async (req, res): Promise<void> => {
  const oid = parseObjectId(req.params.id as string);
  if (!oid) { res.status(400).json({ error: "Invalid id" }); return; }
  const { documentType, status, rejectionReason } = req.body;
  const doc = await DriverDocumentModel.findOneAndUpdate(
    { driverId: oid, documentType },
    {
      $set: {
        status,
        rejectionReason: rejectionReason ?? null,
        verifiedAt: status === "approved" ? new Date() : null,
      },
    },
    { upsert: true, new: true },
  ).lean();
  res.json(docToPlain(doc));
});

router.get("/drivers/:id/rides", authMiddleware, async (req, res): Promise<void> => {
  const oid = parseObjectId(req.params.id as string);
  if (!oid) { res.status(400).json({ error: "Invalid id" }); return; }
  const rides = await RideModel.find({ driverId: oid }).sort({ createdAt: -1 }).limit(20).lean();
  res.json({ data: rides.map(docToPlain), total: rides.length, page: 1, limit: 20 });
});

export default router;
