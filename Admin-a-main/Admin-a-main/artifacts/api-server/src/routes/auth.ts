import { Router, type IRouter } from "express";
import { AdminModel, docToPlain } from "@workspace/db";
import { authMiddleware } from "../lib/auth";

const router: IRouter = Router();

router.get("/auth/me", authMiddleware, async (req, res): Promise<void> => {
  const adminReq = req as typeof req & { admin: { id: string; email: string; role: string } };
  const doc = await AdminModel.findById(adminReq.admin.id).lean();
  const admin = docToPlain(doc);
  if (!admin) {
    res.status(404).json({ error: "Admin not found" });
    return;
  }
  res.json({
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    createdAt: admin.createdAt,
  });
});

router.post("/auth/logout", authMiddleware, async (_req, res): Promise<void> => {
  res.json({ message: "Logged out successfully" });
});

export default router;
