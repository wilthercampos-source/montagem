import { Router } from "express";
import { autenticar, exigirPerfil } from "@/middlewares/auth.middleware";
import {
  listarUsuariosController,
  criarUsuarioController,
  atualizarUsuarioController,
  excluirUsuarioController,
} from "./users.controller";

const router = Router();

router.use(autenticar);

router.get("/", listarUsuariosController);
router.post("/", exigirPerfil("GESTOR"), criarUsuarioController);
router.patch("/:id", exigirPerfil("GESTOR"), atualizarUsuarioController);
router.delete("/:id", exigirPerfil("USUARIO_MASTER"), excluirUsuarioController);

export default router;
