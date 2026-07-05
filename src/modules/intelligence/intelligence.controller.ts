import { Response, NextFunction } from "express";
import { RequestAutenticado } from "@/middlewares/auth.middleware";
import { perguntarSchema } from "./intelligence.validation";
import { responderPergunta } from "./ai.service";
import { dnaOperacional } from "./decision-engine-v2";

export async function perguntarController(req: RequestAutenticado, res: Response, next: NextFunction) {
  try {
    const { pergunta } = perguntarSchema.parse(req.body);
    const resposta = await responderPergunta(req.usuario!.empresaId, pergunta);
    res.json(resposta);
  } catch (err) {
    next(err);
  }
}

export async function dnaOperacionalController(req: RequestAutenticado, res: Response, next: NextFunction) {
  try {
    const dna = await dnaOperacional(req.usuario!.empresaId);
    res.json(dna);
  } catch (err) {
    next(err);
  }
}
