import { Router, type IRouter } from "express";
import {
  DriverModel,
  UserModel,
  DriverDocumentModel,
  RideModel,
  ActivityLogModel,
  docToPlain,
  parseObjectId,
  findByAnyId,
} from "@workspace/db";
import { authMiddleware } from "../lib/auth";

const router: IRouter = Router();

// Drivers are created by the user app: identity (name/phone/email) lives on the
// linked User doc, approval lives in driver.status (pending|approved|rejected).
// Enrich each driver into the shape the admin UI expects.
function enrich(d: any, user: any) {
  const base = docToPlain(d);
  return {
    ...base,
    // never null — the admin UI calls .toLowerCase()/.includes() on these
    name: user?.name ?? base.fullName ?? base.name ?? user?.phone ?? base.phone ?? "Unknown",
    phone: user?.phone ?? base.phone ?? "",
    email: user?.email ?? base.email ?? "",
    profileImage:
      base.driverPhotoUrl ?? base.photo ?? base.profileImage ?? user?.photo ?? null,
    approvalStatus: base.approvalStatus ?? base.status ?? "pending",
    status: base.status ?? base.approvalStatus ?? "pending",
    isOnline: !!base.isOnline,
    vehicleType: base.vehicleType ?? null,
    vehicleNumber: base.vehicleNumber ?? null,
    rating: base.rating ?? 0,
    totalRides: base.totalRides ?? 0,
    totalEarnings: base.totalEarnings ?? 0,
  };
}

async function withUsers(drivers: any[]) {
  const userIds = drivers.map((d) => d.userId).filter(Boolean);
  const users = userIds.length
    ? await UserModel.find({ _id: { $in: userIds } }).lean()
    : [];
  const userMap = new Map(users.map((u: any) => [String(u._id), u]));
  return drivers.map((d) => enrich(d, userMap.get(String(d.userId))));
}

router.get("/drivers", authMiddleware, async (req, res): Promise<void> => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const search = req.query.search as string | undefined;
  const status = req.query.status as string | undefined;
  const approvalStatus = req.query.approvalStatus as string | undefined;
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = {};
  // driver.status holds approval state in the app (pending/approved/rejected)
  if (approvalStatus) filter.status = approvalStatus;
  if (status === "online") filter.isOnline = true;
  else if (status === "offline") filter.isOnline = false;
  else if (status && !["online", "offline"].includes(status)) filter.status = status;

  if (search) {
    const rx = new RegExp(search, "i");
    const matchedUsers = await UserModel.find({ $or: [{ name: rx }, { phone: rx }] })
      .select("_id")
      .lean();
    filter.$or = [
      { fullName: rx },
      { phone: rx },
      { vehicleNumber: rx },
      { userId: { $in: matchedUsers.map((u: any) => String(u._id)) } },
    ];
  }

  const [total, drivers] = await Promise.all([
    DriverModel.countDocuments(filter),
    DriverModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);
  res.json({ data: await withUsers(drivers), total, page, limit });
});

router.get("/drivers/pending-approvals", authMiddleware, async (_req, res): Promise<void> => {
  const drivers = await DriverModel.find({ status: "pending" }).sort({ createdAt: -1 }).lean();
  res.json(await withUsers(drivers));
});

router.get("/drivers/:id", authMiddleware, async (req, res): Promise<void> => {
  const id = parseObjectId(req.params.id as string);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }
  const driverDoc = await findByAnyId(DriverModel, id);
  if (!driverDoc) { res.status(404).json({ error: "Driver not found" }); return; }
  const user = (driverDoc as any).userId
    ? await findByAnyId(UserModel, String((driverDoc as any).userId))
    : null;
  const [docRecords, recentRides] = await Promise.all([
    DriverDocumentModel.find({ driverId: id }).lean(),
    RideModel.find({ driverId: id }).sort({ createdAt: -1 }).limit(10).lean(),
  ]);
  // The app stores doc image URLs directly on the driver record. Build the
  // documents list from those, using any saved verification status.
  const statusByType = new Map<string, string>(
    docRecords.map((d: any) => [d.documentType, d.status]),
  );
  const dd = driverDoc as any;
  const documents = [
    { documentType: "aadhaar", fileUrl: dd.aadhaarUrl },
    { documentType: "driving_license", fileUrl: dd.licenseUrl },
    { documentType: "vehicle_rc", fileUrl: dd.vehicleRcUrl },
    { documentType: "vehicle_photo", fileUrl: dd.vehiclePhotoUrl },
    { documentType: "selfie", fileUrl: dd.driverPhotoUrl ?? dd.photo },
  ]
    .filter((x) => x.fileUrl)
    .map((x) => ({
      documentType: x.documentType,
      fileUrl: x.fileUrl,
      status: statusByType.get(x.documentType) ?? "pending",
    }));
  res.json({
    ...enrich(driverDoc, user),
    documents,
    recentRides: recentRides.map(docToPlain),
  });
});

router.patch("/drivers/:id", authMiddleware, async (req, res): Promise<void> => {
  const id = parseObjectId(req.params.id as string);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }
  const { name, email, vehicleType, vehicleNumber, status, approvalStatus, isOnline } = req.body;
  const updates: Record<string, any> = {};
  if (name !== undefined) updates.fullName = name;
  if (email !== undefined) updates.email = email;
  if (vehicleType !== undefined) updates.vehicleType = vehicleType;
  if (vehicleNumber !== undefined) updates.vehicleNumber = vehicleNumber;
  // approval maps to driver.status
  const newStatus = approvalStatus ?? status;
  if (newStatus !== undefined) updates.status = newStatus;
  if (isOnline !== undefined) updates.isOnline = isOnline;
  const updated = await DriverModel.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
  if (!updated) { res.status(404).json({ error: "Driver not found" }); return; }
  if (newStatus !== undefined && (updated as any).userId) {
    await UserModel.findByIdAndUpdate((updated as any).userId, { $set: { driverStatus: newStatus } });
  }
  const user = (updated as any).userId ? await UserModel.findById((updated as any).userId).lean() : null;
  res.json(enrich(updated, user));
});

router.delete("/drivers/:id", authMiddleware, async (req, res): Promise<void> => {
  const id = parseObjectId(req.params.id as string);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }
  const deleted = await DriverModel.findByIdAndDelete(id).lean();
  if (!deleted) { res.status(404).json({ error: "Driver not found" }); return; }
  res.sendStatus(204);
});

router.post("/drivers/:id/action", authMiddleware, async (req, res): Promise<void> => {
  const id = parseObjectId(req.params.id as string);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }
  const { action } = req.body;
  let updates: Record<string, any> = {};
  let driverStatus: string | undefined;
  switch (action) {
    case "approve": updates = { status: "approved" }; driverStatus = "approved"; break;
    case "reject": updates = { status: "rejected" }; driverStatus = "rejected"; break;
    case "suspend": updates = { status: "suspended", isOnline: false }; driverStatus = "suspended"; break;
    case "unsuspend": updates = { status: "approved" }; driverStatus = "approved"; break;
    case "ban": updates = { status: "banned", isOnline: false }; driverStatus = "banned"; break;
    case "unban": updates = { status: "approved" }; driverStatus = "approved"; break;
    case "force_offline": updates = { isOnline: false }; break;
    case "enable_requests":
    case "disable_requests":
    case "send_notification": break;
    default: res.status(400).json({ error: "Invalid action" }); return;
  }
  const driverDoc = await DriverModel.findById(id).lean();
  if (!driverDoc) { res.status(404).json({ error: "Driver not found" }); return; }
  if (Object.keys(updates).length > 0) {
    await DriverModel.findByIdAndUpdate(id, { $set: updates });
  }
  // Keep the user app in sync — it routes the driver by user.driverStatus
  if (driverStatus !== undefined && (driverDoc as any).userId) {
    await UserModel.findByIdAndUpdate((driverDoc as any).userId, { $set: { driverStatus } });
  }
  await ActivityLogModel.create({ type: "driver_action", message: `Admin performed '${action}' on driver ${id}` });
  const fresh = await DriverModel.findById(id).lean();
  const user = (fresh as any)?.userId ? await UserModel.findById((fresh as any).userId).lean() : null;
  res.json(enrich(fresh, user));
});

router.post("/drivers/:id/verify-document", authMiddleware, async (req, res): Promise<void> => {
  const id = parseObjectId(req.params.id as string);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }
  const { documentType, status, rejectionReason } = req.body;
  const doc = await DriverDocumentModel.findOneAndUpdate(
    { driverId: id, documentType },
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
  const id = parseObjectId(req.params.id as string);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }
  const rides = await RideModel.find({ driverId: id }).sort({ createdAt: -1 }).limit(20).lean();
  res.json({ data: rides.map(docToPlain), total: rides.length, page: 1, limit: 20 });
});

export default router;
