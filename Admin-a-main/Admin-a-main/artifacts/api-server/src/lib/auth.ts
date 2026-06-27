import type { Request, Response, NextFunction } from "express";
import { firebaseAdmin } from "./firebase-admin";
import { AdminModel, docToPlain } from "@workspace/db";

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const token = authHeader.slice(7);
    const decoded = await firebaseAdmin.verifyIdToken(token);
    const email = decoded.email;
    if (!email) {
      res.status(401).json({ error: "Invalid token: no email" });
      return;
    }
    const adminDoc = await AdminModel.findOne({ email }).lean();
    const admin = docToPlain(adminDoc);
    if (!admin || !admin.isActive) {
      res.status(403).json({ error: "Not an authorized admin" });
      return;
    }
    (req as Request & { admin: { id: string; email: string; role: string } }).admin = {
      id: admin.id,
      email: admin.email,
      role: admin.role,
    };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
