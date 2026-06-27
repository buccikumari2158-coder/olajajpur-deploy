import { Router } from "express";
import { v2 as cloudinary } from "cloudinary";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

cloudinary.config({
  cloud_name: process.env["CLOUDINARY_CLOUD_NAME"],
  api_key: process.env["CLOUDINARY_API_KEY"],
  api_secret: process.env["CLOUDINARY_API_SECRET"],
  secure: true,
});

router.post("/uploads/image", requireAuth, async (req, res) => {
  try {
    const { base64, mimeType = "image/jpeg", folder = "misc" } = req.body as {
      base64?: string;
      mimeType?: string;
      folder?: string;
    };

    if (!base64 || typeof base64 !== "string") {
      res.status(400).json({ message: "base64 image data is required" });
      return;
    }

    if (!process.env["CLOUDINARY_CLOUD_NAME"] || !process.env["CLOUDINARY_API_KEY"]) {
      res.status(500).json({ message: "Image storage is not configured." });
      return;
    }

    const safeFolder = (folder ?? "misc").replace(/[^a-z0-9_-]/gi, "") || "misc";
    const dataUri = `data:${mimeType};base64,${base64}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: `jajpur_jatri/${safeFolder}`,
      resource_type: "image",
    });

    res.json({ url: result.secure_url });
  } catch (err) {
    req.log?.error({ err }, "cloudinary upload failed");
    res.status(500).json({ message: "Image upload failed. Please try again." });
  }
});

export default router;
