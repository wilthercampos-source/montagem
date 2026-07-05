import { Router } from "express";
import { autenticar, exigirPerfil } from "@/middlewares/auth.middleware";
import {
  obterConfiguracoesController,
  atualizarEmpresaController,
  atualizarAparenciaController,
  atualizarSegurancaController,
} from "./settings.controller";

const router = Router();

router.use(autenticar);

router.get("/", obterConfiguracoesController);
router.patch("/empresa", exigirPerfil("GESTOR"), atualizarEmpresaController);
router.patch("/aparencia", exigirPerfil("GESTOR"), atualizarAparenciaController);
router.patch("/seguranca", exigirPerfil("USUARIO_MASTER"), atualizarSegurancaController);

export default router;
