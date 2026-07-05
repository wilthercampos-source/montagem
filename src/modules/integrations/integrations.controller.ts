import { Response, NextFunction } from "express";
import { RequestAutenticado } from "@/middlewares/auth.middleware";
import { extrairInfoCliente } from "@/lib/requestInfo";
import { tipoIntegracaoSchema, atualizarConfiguracaoSchema } from "./integrations.validation";
import * as integrationsService from "./integrations.service";

export async function listarController(req: RequestAutenticado, res: Response, next: NextFunction) {
  try {
    const integracoes = await integrationsService.listarIntegracoes(req.usuario!.empresaId);
    res.json(integracoes);
  } catch (err) {
    next(err);
  }
}

export async function alternarController(req: RequestAutenticado, res: Response, next: NextFunction) {
  try {
    const tipo = tipoIntegracaoSchema.parse(req.params.tipo);
    const cliente = extrairInfoCliente(req);
    const integracao = await integrationsService.alternarIntegracao(
      req.usuario!.empresaId,
      tipo,
      req.usuario!.usuarioId,
      cliente
    );
    res.json(integracao);
  } catch (err) {
    next(err);
  }
}

export async function atualizarConfiguracaoController(req: RequestAutenticado, res: Response, next: NextFunction) {
  try {
    const tipo = tipoIntegracaoSchema.parse(req.params.tipo);
    const { configuracao } = atualizarConfiguracaoSchema.parse(req.body);
    const cliente = extrairInfoCliente(req);
    const integracao = await integrationsService.atualizarConfiguracao(
      req.usuario!.empresaId,
      tipo,
      configuracao,
      req.usuario!.usuarioId,
      cliente
    );
    res.json(integracao);
  } catch (err) {
    next(err);
  }
}
