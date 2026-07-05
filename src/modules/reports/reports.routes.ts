import { Router } from "express";
import { autenticar } from "@/middlewares/auth.middleware";
import { exportarExcelController, exportarPDFController, exportarPNGController } from "./reports.controller";

const router = Router();

router.use(autenticar);

router.get("/excel", exportarExcelController);
router.get("/pdf", exportarPDFController);
router.get("/png", exportarPNGController);

export default router;
