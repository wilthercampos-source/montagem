import { Router } from "express";
import { autenticar } from "@/middlewares/auth.middleware";
import { momentosController, estadoNoInstanteController } from "./replay.controller";

const router = Router();

router.use(autenticar);

// ?data=YYYY-MM-DD (opcional, padrão hoje) — lista os instantes com snapshot disponível
router.get("/momentos", momentosController);
// ?timestamp=ISO8601 — reconstrói o estado da operação naquele instante
router.get("/", estadoNoInstanteController);

export default router;
