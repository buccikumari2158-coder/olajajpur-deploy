import { Router } from "express";
import mongoose from "mongoose";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

// Notification history for the logged-in user. Reads the shared "notifications"
// collection that the admin panel writes to (broadcasts + targeted sends).
router.get("/notifications", requireAuth, async (req, res) => {
  const userId = req.auth!.sub;
  try {
    const coll = mongoose.connection.collection("notifications");
    const items = await coll
      .find({
        $or: [
          { targetAudience: { $in: ["all", "users", "passengers", "both"] } },
          { targetIds: userId },
        ],
      })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    res.json({
      notifications: items.map((n) => ({
        id: String(n._id),
        title: n.title ?? "",
        message: n.message ?? "",
        type: n.type ?? "announcement",
        imageUrl: n.imageUrl ?? null,
        createdAt: n.createdAt ?? null,
      })),
    });
  } catch {
    res.json({ notifications: [] });
  }
});

export default router;
