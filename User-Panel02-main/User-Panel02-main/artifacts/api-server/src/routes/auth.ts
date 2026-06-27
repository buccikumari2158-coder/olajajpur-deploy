import { Router } from "express";
import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";
import { User } from "@workspace/db";
import { logger } from "../lib/logger";

const router = Router();

interface FirebaseUserRecord {
  localId: string;
  phoneNumber?: string;
  email?: string;
  displayName?: string;
  photoUrl?: string;
}

interface FirebaseLookupResponse {
  users?: FirebaseUserRecord[];
  error?: { message: string };
}

async function verifyFirebaseToken(idToken: string): Promise<FirebaseUserRecord> {
  const apiKey =
    process.env["FIREBASE_WEB_API_KEY"] ??
    process.env["EXPO_PUBLIC_FIREBASE_API_KEY"] ??
    "";

  if (!apiKey) {
    throw new Error(
      "Auth not configured — add FIREBASE_WEB_API_KEY to server secrets.",
    );
  }

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    },
  );

  const data = (await res.json()) as FirebaseLookupResponse;

  if (!res.ok || data.error) {
    throw new Error(
      `Invalid or expired Firebase token: ${data.error?.message ?? res.statusText}`,
    );
  }

  const user = data.users?.[0];
  if (!user?.localId) {
    throw new Error("Invalid or expired Firebase token");
  }

  return user;
}

function signJwt(payload: Record<string, unknown>): string {
  const secret = process.env["SESSION_SECRET"];
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is not set");
  }
  return jwt.sign(payload, secret, { expiresIn: "30d" });
}

router.post("/auth/firebase-login", async (req, res) => {
  const { idToken, role } = req.body as { idToken?: string; role?: string };

  if (!idToken || typeof idToken !== "string") {
    res.status(400).json({ message: "idToken is required" });
    return;
  }

  const safeRole = role === "driver" ? "driver" : "passenger";

  try {
    const firebaseUser = await verifyFirebaseToken(idToken);

    let user = await User.findOne({ firebaseUid: firebaseUser.localId });

    if (!user) {
      user = new User({
        _id: randomUUID(),
        firebaseUid: firebaseUser.localId,
        phone: firebaseUser.phoneNumber ?? "",
        role: safeRole,
        name: firebaseUser.displayName ?? null,
        email: firebaseUser.email ?? null,
        photo: firebaseUser.photoUrl ?? null,
        walletBalance: 0,
        isDriver: safeRole === "driver",
        driverStatus: null,
      });
      await user.save();
    } else if (safeRole === "driver" && !user.isDriver) {
      user.isDriver = true;
      user.role = "driver";
      await user.save();
    }

    const token = signJwt({ sub: user.id, role: user.role });

    req.log.info({ userId: user.id, role: user.role }, "firebase-login success");

    res.json({
      token,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        photo: user.photo,
        role: user.role,
        walletBalance: user.walletBalance,
        isDriver: user.isDriver,
        driverStatus: user.driverStatus,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Authentication failed";
    logger.error({ err }, "firebase-login error");
    const status =
      message.includes("Invalid or expired") || message.includes("Auth not configured")
        ? 401
        : 500;
    res.status(status).json({ message });
  }
});

export default router;
