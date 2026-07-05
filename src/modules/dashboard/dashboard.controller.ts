import { Response, NextFunction } from "express";
import { RequestAutenticado } from "@/middlewares/auth.middleware";
import * as dashboardService from "./dashboard.service";

export async function dashboardController(req: RequestAutenticado, res: Response, next: NextFunction) {
  try {
    const dados = await dashboardService.obterDashboard(req.usuario!.empresaId);
    res.json(dados);
  } catch (err) {
    next(err);
  }
}

export async function previaController(req: RequestAutenticado, res: Response, next: NextFunction) {
  try {
    const dados = await dashboardService.obterPrevia(req.usuario!.empresaId);
    res.json(dados);
  } catch (err) {
    next(err);
  }
}

export async function prePreviaController(req: RequestAutenticado, res: Response, next: NextFunction) {
  try {
    const dados = await dashboardService.obterPrePrevia(req.usuario!.empresaId);
    res.json(dados);
  } catch (err) {
    next(err);
  }
}
