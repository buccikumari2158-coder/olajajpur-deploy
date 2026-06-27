import { Router } from "express";
import { randomUUID } from "crypto";
import { Driver, User, Ride } from "@workspace/db";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

function requireAdmin(
  req: Parameters<typeof requireAuth>[0],
  res: Parameters<typeof requireAuth>[1],
  next: Parameters<typeof requireAuth>[2],
): void {
  const adminSecret = process.env["ADMIN_SECRET"];
  const header = req.headers["x-admin-secret"];
  if (adminSecret && header === adminSecret) {
    next();
    return;
  }
  requireAuth(req, res, () => {
    if ((req as { auth?: { role?: string } }).auth?.role === "admin") {
      next();
    } else {
      res.status(403).json({ message: "Admin access required" });
    }
  });
}

router.get("/drivers/nearby", async (req, res) => {
  const lat = parseFloat(String(req.query["lat"] ?? "20.8522"));
  const lng = parseFloat(String(req.query["lng"] ?? "86.0"));
  const vehicleType = req.query["vehicleType"] as string | undefined;

  const query: Record<string, unknown> = { isOnline: true, status: "approved" };
  if (vehicleType) query.vehicleType = vehicleType;

  const drivers = await Driver.find(query).lean();

  const MAX_KM = 10;
  const nearby = drivers
    .filter((d) => {
      if (d.currentLat == null || d.currentLng == null) return false;
      const dlat = (d.currentLat - lat) * 111;
      const dlng =
        (d.currentLng - lng) * 111 * Math.cos((lat * Math.PI) / 180);
      return Math.sqrt(dlat * dlat + dlng * dlng) <= MAX_KM;
    })
    .map((d) => ({
      id: d._id,
      vehicleType: d.vehicleType,
      vehicleNumber: d.vehicleNumber,
      vehicleModel: d.vehicleModel,
      rating: d.rating,
      lat: d.currentLat,
      lng: d.currentLng,
      currentLat: d.currentLat,
      currentLng: d.currentLng,
    }));

  res.json({ drivers: nearby });
});

router.get("/drivers/profile", requireAuth, async (req, res) => {
  const userId = req.auth!.sub;

  const driver = await Driver.findOne({ userId }).lean();
  if (!driver) {
    res.status(404).json({ message: "Driver profile not found" });
    return;
  }

  const user = await User.findById(userId).lean();

  res.json({
    id: driver._id,
    vehicleType: driver.vehicleType,
    vehicleNumber: driver.vehicleNumber,
    vehicleModel: driver.vehicleModel,
    licenseUrl: driver.licenseUrl,
    aadhaarUrl: driver.aadhaarUrl,
    vehicleRcUrl: driver.vehicleRcUrl,
    vehiclePhotoUrl: driver.vehiclePhotoUrl,
    driverPhotoUrl: driver.driverPhotoUrl,
    status: driver.status,
    isOnline: driver.isOnline,
    rating: driver.rating,
    totalRides: driver.totalRides,
    name: user?.name ?? null,
    phone: user?.phone ?? null,
    photo: user?.photo ?? null,
  });
});

router.post("/drivers/register", requireAuth, async (req, res) => {
  const userId = req.auth!.sub;

  const {
    fullName,
    email,
    address,
    vehicleType,
    vehicleNumber,
    vehicleModel,
    aadhaarUrl,
    licenseUrl,
    vehicleRcUrl,
    vehiclePhotoUrl,
    driverPhotoUrl,
  } = req.body as {
    fullName?: string;
    email?: string;
    address?: string;
    vehicleType?: string;
    vehicleNumber?: string;
    vehicleModel?: string;
    aadhaarUrl?: string;
    licenseUrl?: string;
    vehicleRcUrl?: string;
    vehiclePhotoUrl?: string;
    driverPhotoUrl?: string;
  };

  const existing = await Driver.findOne({ userId });
  if (existing) {
    res.status(409).json({ message: "Driver profile already exists" });
    return;
  }

  const userUpdates: Record<string, unknown> = { isDriver: true, driverStatus: "pending" };
  if (fullName) userUpdates.name = fullName;
  if (email) userUpdates.email = email;

  await User.findByIdAndUpdate(userId, { $set: userUpdates });

  const driver = new Driver({
    _id: randomUUID(),
    userId,
    address: address ?? null,
    vehicleType: vehicleType ?? null,
    vehicleNumber: vehicleNumber ?? null,
    vehicleModel: vehicleModel ?? null,
    aadhaarUrl: aadhaarUrl ?? null,
    licenseUrl: licenseUrl ?? null,
    vehicleRcUrl: vehicleRcUrl ?? null,
    vehiclePhotoUrl: vehiclePhotoUrl ?? null,
    driverPhotoUrl: driverPhotoUrl ?? null,
    status: "pending",
  });
  await driver.save();

  res.status(201).json({ message: "Registration submitted. Awaiting approval." });
});

router.patch("/drivers/status", requireAuth, async (req, res) => {
  const userId = req.auth!.sub;
  const { isOnline, lat, lng } = req.body as {
    isOnline: boolean;
    lat?: number;
    lng?: number;
  };

  const updates: Record<string, unknown> = { isOnline };
  if (lat !== undefined) updates.currentLat = lat;
  if (lng !== undefined) updates.currentLng = lng;

  const driver = await Driver.findOneAndUpdate(
    { userId },
    { $set: updates },
    { new: true },
  ).lean();

  if (!driver) {
    res.status(404).json({ message: "Driver profile not found" });
    return;
  }

  const user = await User.findById(userId).lean();

  res.json({
    id: driver._id,
    vehicleType: driver.vehicleType,
    vehicleNumber: driver.vehicleNumber,
    vehicleModel: driver.vehicleModel,
    status: driver.status,
    isOnline: driver.isOnline,
    rating: driver.rating,
    totalRides: driver.totalRides,
    name: user?.name ?? null,
    phone: user?.phone ?? null,
  });
});

router.get("/drivers/earnings", requireAuth, async (req, res) => {
  const userId = req.auth!.sub;

  const driver = await Driver.findOne({ userId }).lean();
  if (!driver) {
    res.json({ totalEarnings: 0, dailyData: Array(7).fill({ amount: 0 }) });
    return;
  }

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const completedRides = await Ride.find({
    driverId: driver._id,
    status: "completed",
    createdAt: { $gte: startOfWeek },
  })
    .select("fare createdAt")
    .lean();

  const dailyBuckets: number[] = Array(7).fill(0);
  let totalEarnings = 0;

  for (const ride of completedRides) {
    const day = new Date(ride.createdAt).getDay();
    dailyBuckets[day] += ride.fare;
    totalEarnings += ride.fare;
  }

  const dailyData = dailyBuckets.map((amount, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return { date: d.toISOString().split("T")[0], amount };
  });

  res.json({ totalEarnings, dailyData });
});

router.get("/admin/drivers", requireAdmin, async (req, res) => {
  const status = (req.query["status"] as string) ?? "pending";

  const drivers = await Driver.find({ status }).lean();
  const userIds = drivers.map((d) => d.userId);
  const users = await User.find({ _id: { $in: userIds } }).lean();
  const userMap = new Map(users.map((u) => [u._id, u]));

  const rows = drivers.map((d) => {
    const u = userMap.get(d.userId);
    return {
      id: d._id,
      userId: d.userId,
      vehicleType: d.vehicleType,
      vehicleNumber: d.vehicleNumber,
      vehicleModel: d.vehicleModel,
      address: d.address,
      licenseUrl: d.licenseUrl,
      aadhaarUrl: d.aadhaarUrl,
      vehicleRcUrl: d.vehicleRcUrl,
      vehiclePhotoUrl: d.vehiclePhotoUrl,
      driverPhotoUrl: d.driverPhotoUrl,
      status: d.status,
      createdAt: d.createdAt,
      name: u?.name ?? null,
      phone: u?.phone ?? null,
      email: u?.email ?? null,
    };
  });

  res.json({ drivers: rows });
});

router.patch("/admin/drivers/:id/status", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body as { status: "approved" | "rejected" };

  if (!["approved", "rejected"].includes(status)) {
    res.status(400).json({ message: "status must be 'approved' or 'rejected'" });
    return;
  }

  const driver = await Driver.findByIdAndUpdate(
    id,
    { $set: { status } },
    { new: true },
  );

  if (!driver) {
    res.status(404).json({ message: "Driver not found" });
    return;
  }

  await User.findByIdAndUpdate(driver.userId, { $set: { driverStatus: status } });

  res.json({ message: `Driver ${status}` });
});

export default router;
