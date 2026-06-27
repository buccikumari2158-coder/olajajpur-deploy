import { Server as HttpServer } from "http";
import { Server, type Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { Driver, Ride } from "@workspace/db";
import { logger } from "./lib/logger";

interface AuthPayload {
  sub: string;
  role: string;
}

let _io: Server | null = null;

export function getIo(): Server | null {
  return _io;
}

export async function broadcastRideRequest(ride: {
  id: string;
  vehicleType: string;
  pickupAddress: string;
  dropAddress: string;
  fare: number;
  distance: number;
}) {
  if (!_io) return;
  try {
    const onlineDrivers = await Driver.find({ isOnline: true }).select("_id").lean();

    for (const driver of onlineDrivers) {
      _io.to(`driver:${driver._id}`).emit("ride:new_request", {
        rideId: ride.id,
        pickupAddress: ride.pickupAddress,
        dropAddress: ride.dropAddress,
        fare: ride.fare,
        distance: ride.distance,
        vehicleType: ride.vehicleType,
      });
    }
    logger.info({ rideId: ride.id, drivers: onlineDrivers.length }, "Ride request broadcast");
  } catch (err) {
    logger.error({ err }, "broadcastRideRequest failed");
  }
}

export function initSocket(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    path: "/api/socket.io",
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  _io = io;

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth["token"] as string | undefined;
    const secret = process.env["SESSION_SECRET"];
    if (!token || !secret) {
      next(new Error("Unauthorized"));
      return;
    }
    try {
      const payload = jwt.verify(token, secret) as AuthPayload;
      (socket.data as { auth: AuthPayload }).auth = payload;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const auth = (socket.data as { auth?: AuthPayload }).auth;
    logger.info({ socketId: socket.id, userId: auth?.sub }, "Socket connected");

    socket.on("ride:join", ({ rideId }: { rideId: string }) => {
      socket.join(`ride:${rideId}`);
    });

    socket.on("driver:join", ({ driverId }: { driverId: string }) => {
      socket.join(`driver:${driverId}`);
    });

    socket.on("driver:location", ({ lat, lng }: { lat: number; lng: number }) => {
      if (!auth?.sub) return;
      Driver.findOneAndUpdate(
        { userId: auth.sub },
        { $set: { currentLat: lat, currentLng: lng } },
      ).catch((err) => logger.error({ err }, "location update failed"));
    });

    socket.on(
      "ride:accept",
      async ({ rideId, driverId }: { rideId: string; driverId: string }) => {
        try {
          const existing = await Ride.findById(rideId).select("status").lean();
          if (!existing || existing.status !== "searching") return;

          await Ride.findByIdAndUpdate(rideId, {
            $set: { driverId, status: "assigned" },
          });

          io.to(`ride:${rideId}`).emit("ride:accepted", { rideId, driverId });
          logger.info({ rideId, driverId }, "Ride accepted via socket");
        } catch (err) {
          logger.error({ err }, "ride:accept failed");
        }
      },
    );

    socket.on("ride:reject", ({ rideId }: { rideId: string }) => {
      io.to(`ride:${rideId}`).emit("ride:driver_rejected", {
        message: "A driver declined. Looking for another…",
      });
    });

    socket.on("ride:arrived", ({ rideId }: { rideId: string }) => {
      io.to(`ride:${rideId}`).emit("ride:driver_arrived", { rideId });
    });

    socket.on("disconnect", () => {
      logger.info({ socketId: socket.id }, "Socket disconnected");
    });
  });

  return io;
}
