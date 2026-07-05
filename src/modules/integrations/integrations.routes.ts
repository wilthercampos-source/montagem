import { Router } from "express";
import { autenticar, exigirPerfil } from "@/middlewares/auth.middleware";
import { listarController, alternarController, atualizarConfiguracaoController } from "./integrations.controller";

const router = Router();

router.use(autenticar);

router.get("/", listarController);
router.patch("/:tipo/alternar", exigirPerfil("GESTOR"), alternarController);
router.patch("/:tipo/configuracao", exigirPerfil("GESTOR"), atualizarConfiguracaoController);

export default router;
