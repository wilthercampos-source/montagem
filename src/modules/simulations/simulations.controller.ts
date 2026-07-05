import { Response, NextFunction } from "express";
import { RequestAutenticado } from "@/middlewares/auth.middleware";
import { extrairInfoCliente } from "@/lib/requestInfo";
import { simularCenarioSchema } from "./simulations.validation";
import { simularCenario } from "./simulations.service";

export async function simularController(req: RequestAutenticado, res: Response, next: NextFunction) {
  try {
    const input = simularCenarioSchema.parse(req.body);
    const cliente = extrairInfoCliente(req);
    const resultado = await simularCenario(req.usuario!.empresaId, req.usuario!.usuarioId, input, cliente);
    res.json(resultado);
  } catch (err) {
    next(err);
  }
}
