import { Router } from "express";
import { autenticar, exigirPerfil } from "@/middlewares/auth.middleware";
import { listarAlertasController, resolverAlertaController } from "./alerts.controller";

const router = Router();

router.use(autenticar);

router.get("/", listarAlertasController);
router.patch("/:id/resolver", exigirPerfil("ANALISTA"), resolverAlertaController);

export default router;
