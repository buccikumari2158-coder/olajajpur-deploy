import { Router } from "express";
import { createHmac, randomUUID } from "crypto";
import { User, WalletTransaction } from "@workspace/db";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.post("/payments/order", requireAuth, async (req, res) => {
  const keyId = process.env["RAZORPAY_KEY_ID"] ?? "";
  const keySecret = process.env["RAZORPAY_KEY_SECRET"] ?? "";

  if (!keyId || !keySecret) {
    res.status(503).json({
      message:
        "Payment gateway not configured — add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to server secrets.",
    });
    return;
  }

  const { amount, rideId } = req.body as { amount: number; rideId?: string };
  const amountPaise = Math.round(amount * 100);

  const credentials = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: "INR",
      receipt: rideId ?? randomUUID(),
    }),
  });

  if (!rzpRes.ok) {
    const err = (await rzpRes.json()) as { error?: { description?: string } };
    res.status(502).json({
      message: err.error?.description ?? "Failed to create payment order",
    });
    return;
  }

  const order = (await rzpRes.json()) as { id: string };
  res.json({ keyId, orderId: order.id });
});

router.post("/payments/verify", requireAuth, async (req, res) => {
  const keySecret = process.env["RAZORPAY_KEY_SECRET"] ?? "";
  const userId = req.auth!.sub;

  const { orderId, paymentId, signature, rideId, amount } = req.body as {
    orderId: string;
    paymentId: string;
    signature: string;
    rideId?: string;
    amount?: number;
  };

  if (keySecret) {
    const expected = createHmac("sha256", keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    if (expected !== signature) {
      res.status(400).json({ message: "Payment verification failed — invalid signature." });
      return;
    }
  }

  const creditAmount = Math.round(amount ?? 0);
  const isTopUp = !rideId;

  await new WalletTransaction({
    _id: randomUUID(),
    userId,
    type: "credit",
    description: isTopUp ? "Wallet top-up via Razorpay" : "Online payment for ride",
    amount: creditAmount,
  }).save();

  if (isTopUp && creditAmount > 0) {
    await User.findByIdAndUpdate(userId, { $inc: { walletBalance: creditAmount } });
  }

  res.json({ success: true });
});

export default router;
