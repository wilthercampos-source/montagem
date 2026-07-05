import { Response, NextFunction } from "express";
import { RequestAutenticado } from "@/middlewares/auth.middleware";
import { obterTimeline, TipoEventoTimeline } from "./timeline.service";

const TIPOS_VALIDOS = new Set(["importacao", "alerta", "operacao", "sistema"]);

export async function timelineController(req: RequestAutenticado, res: Response, next: NextFunction) {
  try {
    const tipoQuery = req.query.tipo as string | undefined;
    const tipo = tipoQuery && TIPOS_VALIDOS.has(tipoQuery) ? (tipoQuery as TipoEventoTimeline) : undefined;
    const limite = req.query.limite ? Number(req.query.limite) : 100;

    const eventos = await obterTimeline(req.usuario!.empresaId, tipo, limite);
    res.json(eventos);
  } catch (err) {
    next(err);
  }
}
