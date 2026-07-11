import { Router, type IRouter } from "express";
import {
  RideModel,
  UserModel,
  DriverModel,
  ActivityLogModel,
  docToPlain,
  parseObjectId,
  findByAnyId,
} from "@workspace/db";
import { authMiddleware } from "../lib/auth";

const router: IRouter = Router();

router.get("/rides/active", authMiddleware, async (_req, res): Promise<void> => {
  const rides = await RideModel.find({ status: "active" }).sort({ createdAt: -1 }).lean();
  res.json(rides.map(docToPlain));
});

router.get("/rides", authMiddleware, async (req, res): Promise<void> => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const status = req.query.status as string | undefined;
  const dateFrom = req.query.dateFrom as string | undefined;
  const dateTo = req.query.dateTo as string | undefined;
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = {};
  if (status) filter.status = status;
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);
  }

  const [total, rides] = await Promise.all([
    RideModel.countDocuments(filter),
    RideModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);

  const enriched = await Promise.all(
    rides.map(async (ride: any) => {
      const r = docToPlain(ride);
      const passengerId = ride.passengerId ?? ride.userId;
      const userDoc: any = passengerId ? await UserModel.findById(passengerId).lean() : null;
      let driverName: string | null = null;
      if (ride.driverId) {
        const drv: any = await DriverModel.findById(ride.driverId).lean();
        const drvUser: any = drv?.userId ? await UserModel.findById(drv.userId).lean() : null;
        driverName = drvUser?.name ?? drv?.fullName ?? drv?.name ?? null;
      }
      return { ...r, userId: passengerId ?? null, userName: userDoc?.name ?? null, driverName };
    }),
  );
  res.json({ data: enriched, total, page, limit });
});

router.get("/rides/:id", authMiddleware, async (req, res): Promise<void> => {
  const oid = parseObjectId(req.params.id as string);
  if (!oid) { res.status(400).json({ error: "Invalid id" }); return; }
  const rideDoc = await findByAnyId(RideModel, oid);
  if (!rideDoc) { res.status(404).json({ error: "Ride not found" }); return; }
  const ride = docToPlain(rideDoc);
  const passengerId = (rideDoc as any).passengerId ?? (rideDoc as any).userId;
  const [userDoc, driverDoc] = await Promise.all([
    passengerId ? UserModel.findById(passengerId).lean() : null,
    (rideDoc as any).driverId ? DriverModel.findById((rideDoc as any).driverId).lean() : null,
  ]);
  const user = userDoc ? docToPlain(userDoc) : null;
  const driver = driverDoc ? docToPlain(driverDoc) : null;
  res.json({ ...ride, userName: user?.name ?? null, driverName: driver?.name ?? null, user, driver });
});

router.patch("/rides/:id", authMiddleware, async (req, res): Promise<void> => {
  const oid = parseObjectId(req.params.id as string);
  if (!oid) { res.status(400).json({ error: "Invalid id" }); return; }
  const { status, fare, driverId } = req.body;
  const updates: Record<string, any> = {};
  if (status !== undefined) updates.status = status;
  if (fare !== undefined) updates.fare = fare;
  if (driverId !== undefined) {
    const driverOid = parseObjectId(driverId);
    if (driverOid) updates.driverId = driverOid;
  }
  const updated = await RideModel.findByIdAndUpdate(oid, { $set: updates }, { new: true }).lean();
  if (!updated) { res.status(404).json({ error: "Ride not found" }); return; }
  res.json({ ...docToPlain(updated), userName: null, driverName: null });
});

router.post("/rides/:id/cancel", authMiddleware, async (req, res): Promise<void> => {
  const oid = parseObjectId(req.params.id as string);
  if (!oid) { res.status(400).json({ error: "Invalid id" }); return; }
  const { reason } = req.body;
  const updated = await RideModel.findByIdAndUpdate(
    oid,
    { $set: { status: "cancelled", cancelledBy: "admin", cancellationReason: reason } },
    { new: true },
  ).lean();
  if (!updated) { res.status(404).json({ error: "Ride not found" }); return; }
  await ActivityLogModel.create({ type: "ride_cancelled", message: `Admin cancelled ride ${req.params.id}: ${reason}` });
  res.json({ ...docToPlain(updated), userName: null, driverName: null });
});

router.post("/rides/:id/assign-driver", authMiddleware, async (req, res): Promise<void> => {
  const oid = parseObjectId(req.params.id as string);
  if (!oid) { res.status(400).json({ error: "Invalid id" }); return; }
  const { driverId } = req.body;
  const driverOid = parseObjectId(driverId);
  if (!driverOid) { res.status(400).json({ error: "Invalid driverId" }); return; }
  const updated = await RideModel.findByIdAndUpdate(oid, { $set: { driverId: driverOid } }, { new: true }).lean();
  if (!updated) { res.status(404).json({ error: "Ride not found" }); return; }
  res.json({ ...docToPlain(updated), userName: null, driverName: null });
});

export default router;
