import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

const store = {
  termsUrl: process.env["TERMS_URL"] ?? null as string | null,
  privacyUrl: process.env["PRIVACY_URL"] ?? null as string | null,
};

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

router.get("/settings/public", (_req, res) => {
  res.json({ termsUrl: store.termsUrl, privacyUrl: store.privacyUrl });
});

router.patch("/admin/settings", requireAdmin, (req, res) => {
  const { termsUrl, privacyUrl } = req.body as {
    termsUrl?: string | null;
    privacyUrl?: string | null;
  };
  if (termsUrl !== undefined) store.termsUrl = termsUrl;
  if (privacyUrl !== undefined) store.privacyUrl = privacyUrl;
  res.json({ termsUrl: store.termsUrl, privacyUrl: store.privacyUrl });
});

export default router;
