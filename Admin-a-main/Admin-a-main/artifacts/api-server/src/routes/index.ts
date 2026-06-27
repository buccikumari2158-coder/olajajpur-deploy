import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import dashboardRouter from "./dashboard";
import usersRouter from "./users";
import driversRouter from "./drivers";
import ridesRouter from "./rides";
import pricingRouter from "./pricing";
import paymentsRouter from "./payments";
import walletsRouter from "./wallets";
import notificationsRouter from "./notifications";
import promosRouter from "./promos";
import supportRouter from "./support";
import settingsRouter from "./settings";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(dashboardRouter);
router.use(usersRouter);
router.use(driversRouter);
router.use(ridesRouter);
router.use(pricingRouter);
router.use(paymentsRouter);
router.use(walletsRouter);
router.use(notificationsRouter);
router.use(promosRouter);
router.use(supportRouter);
router.use(settingsRouter);

export default router;
