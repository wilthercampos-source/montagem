import { Router } from "express";
import { autenticar } from "@/middlewares/auth.middleware";
import { timelineController } from "./timeline.controller";

const router = Router();

router.use(autenticar);

// ?tipo=importacao|alerta|operacao|sistema (opcional) &limite=N
router.get("/", timelineController);

export default router;
