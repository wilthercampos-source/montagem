import { Response, NextFunction } from "express";
import { RequestAutenticado } from "@/middlewares/auth.middleware";
import { extrairInfoCliente } from "@/lib/requestInfo";
import {
  atualizarEmpresaSchema,
  atualizarAparenciaSchema,
  atualizarSegurancaSchema,
} from "./settings.validation";
import * as settingsService from "./settings.service";

export async function obterConfiguracoesController(req: RequestAutenticado, res: Response, next: NextFunction) {
  try {
    const config = await settingsService.obterConfiguracoes(req.usuario!.empresaId);
    res.json(config);
  } catch (err) {
    next(err);
  }
}

export async function atualizarEmpresaController(req: RequestAutenticado, res: Response, next: NextFunction) {
  try {
    const input = atualizarEmpresaSchema.parse(req.body);
    const cliente = extrairInfoCliente(req);
    const empresa = await settingsService.atualizarEmpresa(req.usuario!.empresaId, req.usuario!.usuarioId, input, cliente);
    res.json(empresa);
  } catch (err) {
    next(err);
  }
}

export async function atualizarAparenciaController(req: RequestAutenticado, res: Response, next: NextFunction) {
  try {
    const input = atualizarAparenciaSchema.parse(req.body);
    const cliente = extrairInfoCliente(req);
    const empresa = await settingsService.atualizarAparencia(req.usuario!.empresaId, req.usuario!.usuarioId, input, cliente);
    res.json(empresa);
  } catch (err) {
    next(err);
  }
}

export async function atualizarSegurancaController(req: RequestAutenticado, res: Response, next: NextFunction) {
  try {
    const input = atualizarSegurancaSchema.parse(req.body);
    const cliente = extrairInfoCliente(req);
    const empresa = await settingsService.atualizarSeguranca(req.usuario!.empresaId, req.usuario!.usuarioId, input, cliente);
    res.json(empresa);
  } catch (err) {
    next(err);
  }
}
