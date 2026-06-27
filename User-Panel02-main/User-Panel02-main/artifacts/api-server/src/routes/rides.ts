import { Router } from "express";
import { randomUUID } from "crypto";
import { Ride, Driver, User, WalletTransaction } from "@workspace/db";
import { requireAuth } from "../middleware/requireAuth";
import { broadcastRideRequest } from "../socket";

async function sendPush(token: string, title: string, body: string): Promise<void> {
  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ to: token, title, body, sound: "default" }),
    });
  } catch {
    // Non-fatal — push failures don't block the API response
  }
}

const router = Router();

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

router.post("/rides", requireAuth, async (req, res) => {
  const passengerId = req.auth!.sub;

  const {
    pickupLat,
    pickupLng,
    pickupAddress,
    dropLat,
    dropLng,
    dropAddress,
    vehicleType,
    paymentMethod,
    fare,
    distance,
  } = req.body as {
    pickupLat: number;
    pickupLng: number;
    pickupAddress: string;
    dropLat: number;
    dropLng: number;
    dropAddress: string;
    vehicleType: string;
    paymentMethod?: string;
    fare: number;
    distance: number;
  };

  const roundedFare = Math.round(fare);
  const method = paymentMethod ?? "cash";

  if (method === "wallet") {
    const user = await User.findById(passengerId).select("walletBalance").lean();
    if ((user?.walletBalance ?? 0) < roundedFare) {
      res.status(400).json({ message: "Insufficient wallet balance" });
      return;
    }
  }

  const id = randomUUID();
  const ride = new Ride({
    _id: id,
    passengerId,
    pickupLat,
    pickupLng,
    pickupAddress,
    dropLat,
    dropLng,
    dropAddress,
    vehicleType,
    paymentMethod: method,
    fare: roundedFare,
    distance,
    otp: generateOtp(),
    status: "searching",
  });
  await ride.save();

  broadcastRideRequest({
    id,
    vehicleType,
    pickupAddress,
    dropAddress,
    fare: roundedFare,
    distance,
  }).catch(() => {});

  res.status(201).json({ id });
});

router.get("/rides/current", requireAuth, async (req, res) => {
  const userId = req.auth!.sub;

  const ride = await Ride.findOne({
    passengerId: userId,
    status: { $in: ["searching", "assigned", "arrived", "in_progress"] },
  })
    .sort({ createdAt: -1 })
    .lean();

  if (!ride) {
    res.json({ ride: null });
    return;
  }

  let driverInfo = null;
  if (ride.driverId) {
    const driver = await Driver.findById(ride.driverId).lean();
    if (driver) {
      const driverUser = await User.findById(driver.userId).lean();
      let eta = 5;
      if (
        driver.currentLat != null &&
        driver.currentLng != null &&
        ride.pickupLat != null &&
        ride.pickupLng != null
      ) {
        const dlat = (driver.currentLat - ride.pickupLat) * 111;
        const dlng =
          (driver.currentLng - ride.pickupLng) *
          111 *
          Math.cos((ride.pickupLat * Math.PI) / 180);
        const distKm = Math.sqrt(dlat * dlat + dlng * dlng);
        eta = Math.max(1, Math.round((distKm / 25) * 60));
      }
      driverInfo = {
        name: driverUser?.name ?? null,
        phone: driverUser?.phone ?? null,
        photo: driverUser?.photo ?? null,
        rating: driver.rating,
        vehicleType: driver.vehicleType,
        vehicleNumber: driver.vehicleNumber,
        eta,
      };
    }
  }

  res.json({
    ride: {
      id: ride._id,
      fare: ride.fare,
      distance: ride.distance,
      pickupAddress: ride.pickupAddress,
      dropAddress: ride.dropAddress,
      vehicleType: ride.vehicleType,
      paymentMethod: ride.paymentMethod,
      otp: ride.otp,
      status: ride.status,
      pickupLat: ride.pickupLat,
      pickupLng: ride.pickupLng,
      dropLat: ride.dropLat,
      dropLng: ride.dropLng,
      driver: driverInfo,
      createdAt: ride.createdAt,
    },
  });
});

router.get("/rides/history", requireAuth, async (req, res) => {
  const userId = req.auth!.sub;

  const driver = await Driver.findOne({ userId }).select("_id").lean();
  const driverId = driver?._id ?? null;

  const orClauses: Record<string, unknown>[] = [{ passengerId: userId }];
  if (driverId) orClauses.push({ driverId });

  const rides = await Ride.find({
    $or: orClauses,
    status: { $in: ["completed", "cancelled"] },
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .select(
      "_id dropAddress pickupAddress fare distance vehicleType paymentMethod status rating createdAt",
    )
    .lean();

  const rows = rides.map((r) => ({
    id: r._id,
    dropAddress: r.dropAddress,
    pickupAddress: r.pickupAddress,
    fare: r.fare,
    distance: r.distance,
    vehicleType: r.vehicleType,
    paymentMethod: r.paymentMethod,
    status: r.status,
    rating: r.rating,
    createdAt: r.createdAt,
  }));

  res.json({ rides: rows });
});

router.get("/rides/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  const ride = await Ride.findById(id).lean();
  if (!ride) {
    res.status(404).json({ message: "Ride not found" });
    return;
  }

  res.json({ ...ride, id: ride._id });
});

router.post("/rides/:id/cancel", requireAuth, async (req, res) => {
  const { id } = req.params;
  const userId = req.auth!.sub;

  const ride = await Ride.findById(id).lean();
  if (!ride) {
    res.status(404).json({ message: "Ride not found" });
    return;
  }

  const isPassenger = ride.passengerId === userId;

  let isDriver = false;
  if (ride.driverId) {
    const driver = await Driver.findById(ride.driverId).select("userId").lean();
    isDriver = driver?.userId === userId;
  }

  if (!isPassenger && !isDriver) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  if (!["searching", "assigned", "in_progress"].includes(ride.status ?? "")) {
    res.status(400).json({ message: "Cannot cancel a ride that is already completed or cancelled." });
    return;
  }

  await Ride.findByIdAndUpdate(id, { $set: { status: "cancelled" } });

  const io = (await import("../socket")).getIo();
  io?.to(`ride:${id}`).emit("ride:cancelled", {
    rideId: id,
    cancelledBy: isDriver ? "driver" : "passenger",
  });

  res.json({ message: "Ride cancelled" });
});

router.post("/rides/:id/accept", requireAuth, async (req, res) => {
  const { id } = req.params;
  const userId = req.auth!.sub;

  const driver = await Driver.findOne({ userId }).select("_id status").lean();
  if (!driver) {
    res.status(404).json({ message: "Driver profile not found" });
    return;
  }
  if (driver.status !== "approved") {
    res.status(403).json({ message: "Driver is not approved" });
    return;
  }

  const ride = await Ride.findOneAndUpdate(
    { _id: id, status: "searching" },
    { $set: { driverId: driver._id, status: "assigned" } },
    { new: true },
  ).lean();

  if (!ride) {
    res.status(404).json({ message: "Ride not found or no longer available" });
    return;
  }

  const io = (await import("../socket")).getIo();
  io?.to(`ride:${id}`).emit("ride:accepted", {
    rideId: id,
    driverId: driver._id,
  });

  const passenger = await User.findById(ride.passengerId).select("pushToken name").lean();
  if (passenger?.pushToken) {
    await sendPush(passenger.pushToken, "Driver Found! 🚗", "Your driver is on the way. Share the OTP when they arrive.");
  }

  res.json({ message: "Ride accepted", rideId: id, status: "assigned" });
});

router.post("/rides/:id/arrived", requireAuth, async (req, res) => {
  const { id } = req.params;
  const userId = req.auth!.sub;

  const driver = await Driver.findOne({ userId }).select("_id").lean();
  if (!driver) {
    res.status(404).json({ message: "Driver profile not found" });
    return;
  }

  const ride = await Ride.findOneAndUpdate(
    { _id: id, driverId: driver._id, status: "assigned" },
    { $set: { status: "arrived" } },
    { new: true },
  ).lean();

  if (!ride) {
    res.status(404).json({ message: "Ride not found or not in assigned state" });
    return;
  }

  const io = (await import("../socket")).getIo();
  io?.to(`ride:${id}`).emit("ride:arrived", { rideId: id });

  const passenger = await User.findById(ride.passengerId).select("pushToken").lean();
  if (passenger?.pushToken) {
    await sendPush(passenger.pushToken, "Driver Arrived 📍", `Your driver has arrived at the pickup point. OTP: ${ride.otp}`);
  }

  res.json({ message: "Driver arrived", rideId: id, status: "arrived" });
});

router.post("/rides/:id/start", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { otp } = req.body as { otp: string };

  const ride = await Ride.findById(id).lean();
  if (!ride) {
    res.status(404).json({ message: "Ride not found" });
    return;
  }

  if (ride.otp !== otp) {
    res.status(400).json({ message: "Wrong OTP — please ask the passenger for the correct code." });
    return;
  }

  await Ride.findByIdAndUpdate(id, { $set: { status: "in_progress" } });

  res.json({ ...ride, id: ride._id, status: "in_progress" });
});

router.post("/rides/:id/complete", requireAuth, async (req, res) => {
  const { id } = req.params;
  const userId = req.auth!.sub;

  const ride = await Ride.findById(id).lean();
  if (!ride) {
    res.status(404).json({ message: "Ride not found" });
    return;
  }

  await Ride.findByIdAndUpdate(id, { $set: { status: "completed" } });

  if (ride.paymentMethod === "wallet") {
    const fare = ride.fare;
    await User.findByIdAndUpdate(ride.passengerId, { $inc: { walletBalance: -fare } });
    await new WalletTransaction({
      _id: randomUUID(),
      userId: ride.passengerId,
      type: "debit",
      description: `Ride fare — ${(ride.dropAddress ?? "destination").slice(0, 40)}`,
      amount: fare,
    }).save();
  }

  if (ride.driverId) {
    await Driver.findByIdAndUpdate(ride.driverId, { $inc: { totalRides: 1 } });
    const driverDoc = await Driver.findById(ride.driverId).select("userId").lean();
    if (driverDoc) {
      const driverUser = await User.findById(driverDoc.userId).select("pushToken").lean();
      if (driverUser?.pushToken) {
        await sendPush(driverUser.pushToken, "Ride Completed ✅", `₹${ride.fare} earned. Great job!`);
      }
    }
  }

  const passenger = await User.findById(ride.passengerId).select("pushToken").lean();
  if (passenger?.pushToken) {
    await sendPush(passenger.pushToken, "Ride Completed 🎉", `Your ride to ${(ride.dropAddress ?? "destination").slice(0, 40)} is complete. Rate your driver!`);
  }

  res.json({ ...ride, id: ride._id, status: "completed" });
});

router.post("/rides/:id/rate", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body as { rating: number; comment?: string };

  const clampedRating = Math.min(5, Math.max(1, Math.round(rating)));

  await Ride.findByIdAndUpdate(id, {
    $set: { rating: clampedRating, ratingComment: comment ?? null },
  });

  const ride = await Ride.findById(id).select("driverId").lean();
  if (ride?.driverId) {
    const driver = await Driver.findById(ride.driverId).select("rating ratingCount").lean();
    if (driver) {
      const newCount = driver.ratingCount + 1;
      const newAvg = (driver.rating * driver.ratingCount + rating) / newCount;
      await Driver.findByIdAndUpdate(ride.driverId, {
        $set: { rating: parseFloat(newAvg.toFixed(2)), ratingCount: newCount },
      });
    }
  }

  res.json({ message: "Rating submitted" });
});

export default router;
