import { Response, NextFunction } from "express";
import { RequestAutenticado } from "@/middlewares/auth.middleware";
import { extrairInfoCliente } from "@/lib/requestInfo";
import { perguntarMontaAISchema } from "./montaai.validation";
import { processarComando } from "./montaai.service";

export async function perguntarMontaAIController(req: RequestAutenticado, res: Response, next: NextFunction) {
  try {
    const { texto } = perguntarMontaAISchema.parse(req.body);
    const cliente = extrairInfoCliente(req);
    const resultado = await processarComando(req.usuario!.empresaId, req.usuario!.usuarioId, texto, cliente);
    res.json(resultado);
  } catch (err) {
    next(err);
  }
}
