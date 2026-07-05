import { Router } from "express";
import { autenticar } from "@/middlewares/auth.middleware";
import { dashboardController, previaController, prePreviaController } from "./dashboard.controller";

const router = Router();

router.use(autenticar);

router.get("/", dashboardController);
router.get("/previa", previaController);
router.get("/preprevia", prePreviaController);

export default router;
