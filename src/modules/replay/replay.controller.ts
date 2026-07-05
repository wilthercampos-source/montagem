import { Response, NextFunction } from "express";
import { RequestAutenticado } from "@/middlewares/auth.middleware";
import { ErroAplicacao } from "@/middlewares/error.middleware";
import * as replayService from "./replay.service";

export async function momentosController(req: RequestAutenticado, res: Response, next: NextFunction) {
  try {
    const data = req.query.data ? new Date(req.query.data as string) : undefined;
    const momentos = await replayService.listarMomentosDisponiveis(req.usuario!.empresaId, data);
    res.json(momentos);
  } catch (err) {
    next(err);
  }
}

export async function estadoNoInstanteController(req: RequestAutenticado, res: Response, next: NextFunction) {
  try {
    const timestampRaw = req.query.timestamp as string | undefined;
    if (!timestampRaw) {
      throw new ErroAplicacao("Informe o parâmetro 'timestamp' (ISO 8601).", 400);
    }
    const timestamp = new Date(timestampRaw);
    if (Number.isNaN(timestamp.getTime())) {
      throw new ErroAplicacao("Timestamp inválido.", 400);
    }

    const estado = await replayService.estadoNoInstante(req.usuario!.empresaId, timestamp);
    res.json(estado);
  } catch (err) {
    next(err);
  }
}
