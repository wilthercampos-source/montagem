import { Router } from "express";
import { autenticar, exigirPerfil, RequestAutenticado } from "@/middlewares/auth.middleware";
import { listarAuditoria } from "./audit.service";

const router = Router();

// Apenas Gestor ou acima pode visualizar a trilha de auditoria.
router.get("/", autenticar, exigirPerfil("GESTOR"), async (req: RequestAutenticado, res, next) => {
  try {
    const limite = req.query.limite ? Number(req.query.limite) : 50;
    const registros = await listarAuditoria(req.usuario!.empresaId, limite);
    res.json(registros);
  } catch (err) {
    next(err);
  }
});

export default router;
