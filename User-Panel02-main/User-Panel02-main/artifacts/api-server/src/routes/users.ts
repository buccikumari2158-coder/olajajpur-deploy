import { Router } from "express";
import { User } from "@workspace/db";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.get("/users/me", requireAuth, async (req, res) => {
  const userId = req.auth!.sub;

  const user = await User.findById(userId);
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  res.json({
    id: user.id,
    phone: user.phone,
    name: user.name,
    email: user.email,
    photo: user.photo,
    role: user.role,
    walletBalance: user.walletBalance,
    isDriver: user.isDriver,
    driverStatus: user.driverStatus,
  });
});

router.patch("/users/me", requireAuth, async (req, res) => {
  const userId = req.auth!.sub;
  const { name, email, photo } = req.body as {
    name?: string;
    email?: string;
    photo?: string;
  };

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (email !== undefined) updates.email = email;
  if (photo !== undefined) updates.photo = photo;

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ message: "No fields to update" });
    return;
  }

  const user = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true });
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  res.json({
    id: user.id,
    phone: user.phone,
    name: user.name,
    email: user.email,
    photo: user.photo,
    role: user.role,
    walletBalance: user.walletBalance,
    isDriver: user.isDriver,
    driverStatus: user.driverStatus,
  });
});

router.patch("/users/me/push-token", requireAuth, async (req, res) => {
  const userId = req.auth!.sub;
  const { pushToken } = req.body as { pushToken: string | null };

  await User.findByIdAndUpdate(userId, { $set: { pushToken: pushToken ?? null } });
  res.json({ success: true });
});

export default router;
