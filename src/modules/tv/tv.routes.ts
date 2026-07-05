import { Router } from "express";
import { autenticar } from "@/middlewares/auth.middleware";
import { painelTVController } from "./tv.controller";

const router = Router();

// Autenticado como as demais telas — o modo "sem menus/sem interação" é
// uma decisão de UI do frontend, não uma rota pública.
router.use(autenticar);

router.get("/", painelTVController);

export default router;
