import { Router, type IRouter } from "express";
import {
  UserModel,
  DriverModel,
  RideModel,
  PaymentModel,
  SupportTicketModel,
  NotificationModel,
  WalletTransactionModel,
  ActivityLogModel,
  docToPlain,
} from "@workspace/db";
import { authMiddleware } from "../lib/auth";

const router: IRouter = Router();

router.get("/dashboard/stats", authMiddleware, async (_req, res): Promise<void> => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers,
    totalDrivers,
    onlineDrivers,
    activeRides,
    completedRides,
    cancelledRides,
    pendingApprovals,
    totalComplaints,
    totalNotifications,
    walletTxCount,
    earningsAgg,
    todayEarningsAgg,
    weeklyEarningsAgg,
    monthlyEarningsAgg,
  ] = await Promise.all([
    UserModel.countDocuments(),
    DriverModel.countDocuments(),
    DriverModel.countDocuments({ isOnline: true }),
    RideModel.countDocuments({ status: "active" }),
    RideModel.countDocuments({ status: "completed" }),
    RideModel.countDocuments({ status: "cancelled" }),
    DriverModel.countDocuments({ approvalStatus: "pending" }),
    SupportTicketModel.countDocuments(),
    NotificationModel.countDocuments(),
    WalletTransactionModel.countDocuments(),
    PaymentModel.aggregate([{ $match: { status: "success" } }, { $group: { _id: null, sum: { $sum: "$amount" } } }]),
    PaymentModel.aggregate([{ $match: { status: "success", createdAt: { $gte: todayStart } } }, { $group: { _id: null, sum: { $sum: "$amount" } } }]),
    PaymentModel.aggregate([{ $match: { status: "success", createdAt: { $gte: weekStart } } }, { $group: { _id: null, sum: { $sum: "$amount" } } }]),
    PaymentModel.aggregate([{ $match: { status: "success", createdAt: { $gte: monthStart } } }, { $group: { _id: null, sum: { $sum: "$amount" } } }]),
  ]);

  res.json({
    totalUsers,
    totalDrivers,
    onlineDrivers,
    offlineDrivers: totalDrivers - onlineDrivers,
    activeRides,
    completedRides,
    cancelledRides,
    pendingApprovals,
    totalEarnings: earningsAgg[0]?.sum ?? 0,
    todayEarnings: todayEarningsAgg[0]?.sum ?? 0,
    weeklyEarnings: weeklyEarningsAgg[0]?.sum ?? 0,
    monthlyEarnings: monthlyEarningsAgg[0]?.sum ?? 0,
    totalComplaints,
    totalNotifications,
    totalWalletTransactions: walletTxCount,
  });
});

router.get("/dashboard/earnings", authMiddleware, async (req, res): Promise<void> => {
  const period = (req.query.period as string) ?? "week";
  const days = period === "today" ? 1 : period === "week" ? 7 : period === "month" ? 30 : 365;
  const points: { date: string; amount: number; rides: number }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    const [earnAgg, rideCount] = await Promise.all([
      PaymentModel.aggregate([
        { $match: { status: "success", createdAt: { $gte: start, $lt: end } } },
        { $group: { _id: null, sum: { $sum: "$amount" } } },
      ]),
      RideModel.countDocuments({ status: "completed", createdAt: { $gte: start, $lt: end } }),
    ]);
    points.push({
      date: start.toISOString().split("T")[0],
      amount: earnAgg[0]?.sum ?? 0,
      rides: rideCount,
    });
  }
  res.json(points);
});

router.get("/dashboard/ride-analytics", authMiddleware, async (_req, res): Promise<void> => {
  const [completed, cancelled, active, pending] = await Promise.all([
    RideModel.countDocuments({ status: "completed" }),
    RideModel.countDocuments({ status: "cancelled" }),
    RideModel.countDocuments({ status: "active" }),
    RideModel.countDocuments({ status: "pending" }),
  ]);
  const totalCount = completed + cancelled + active + pending;
  res.json({
    completed,
    cancelled,
    active,
    pending,
    completionRate: totalCount > 0 ? Math.round((completed / totalCount) * 100) : 0,
  });
});

router.get("/dashboard/recent-activity", authMiddleware, async (_req, res): Promise<void> => {
  const items = await ActivityLogModel.find().sort({ timestamp: -1 }).limit(20).lean();
  res.json(
    items.map((item: any) => ({
      id: String(item._id),
      type: item.type,
      message: item.message,
      timestamp: item.timestamp,
      metadata: item.metadata ?? null,
    })),
  );
});

export default router;
