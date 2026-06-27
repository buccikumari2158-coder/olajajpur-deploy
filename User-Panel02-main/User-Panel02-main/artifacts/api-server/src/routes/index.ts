import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import settingsRouter from "./settings";
import driversRouter from "./drivers";
import ridesRouter from "./rides";
import walletRouter from "./wallet";
import paymentsRouter from "./payments";
import legalRouter from "./legal";
import uploadsRouter from "./uploads";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(settingsRouter);
router.use(driversRouter);
router.use(ridesRouter);
router.use(walletRouter);
router.use(paymentsRouter);
router.use(legalRouter);
router.use(uploadsRouter);

export default router;
