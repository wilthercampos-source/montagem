import { Response, NextFunction } from "express";
import { RequestAutenticado } from "@/middlewares/auth.middleware";
import { extrairInfoCliente } from "@/lib/requestInfo";
import * as alertsService from "./alerts.service";

export async function listarAlertasController(req: RequestAutenticado, res: Response, next: NextFunction) {
  try {
    const filtro = (req.query.filtro as "ativos" | "resolvidos" | "todos") ?? "ativos";
    const alertas = await alertsService.listarAlertas(req.usuario!.empresaId, filtro);
    res.json(alertas);
  } catch (err) {
    next(err);
  }
}

export async function resolverAlertaController(req: RequestAutenticado, res: Response, next: NextFunction) {
  try {
    const cliente = extrairInfoCliente(req);
    const alerta = await alertsService.resolverAlerta(
      req.usuario!.empresaId,
      req.params.id,
      req.usuario!.usuarioId,
      cliente
    );
    res.json(alerta);
  } catch (err) {
    next(err);
  }
}
