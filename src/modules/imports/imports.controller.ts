import { Response, NextFunction } from "express";
import { RequestAutenticado } from "@/middlewares/auth.middleware";
import { extrairInfoCliente } from "@/lib/requestInfo";
import { ErroAplicacao } from "@/middlewares/error.middleware";
import { uploadImportacaoSchema } from "./imports.validation";
import * as importsService from "./imports.service";

interface RequestComArquivo extends RequestAutenticado {
  file?: Express.Multer.File;
}

export async function uploadController(req: RequestComArquivo, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      throw new ErroAplicacao("Nenhum arquivo enviado.", 400);
    }
    const { rotina } = uploadImportacaoSchema.parse(req.body);
    const cliente = extrairInfoCliente(req);

    const importacao = await importsService.uploadEValidar(
      req.usuario!.empresaId,
      req.usuario!.usuarioId,
      rotina,
      req.file,
      cliente
    );

    res.status(importacao.status === "ERRO" ? 422 : 201).json(importacao);
  } catch (err) {
    next(err);
  }
}

export async function processarController(req: RequestAutenticado, res: Response, next: NextFunction) {
  try {
    const cliente = extrairInfoCliente(req);
    const resultado = await importsService.processarImportacao(
      req.usuario!.empresaId,
      req.params.id,
      req.usuario!.usuarioId,
      cliente
    );
    res.json(resultado);
  } catch (err) {
    next(err);
  }
}

export async function listarController(req: RequestAutenticado, res: Response, next: NextFunction) {
  try {
    const limite = req.query.limite ? Number(req.query.limite) : 50;
    const importacoes = await importsService.listarImportacoes(req.usuario!.empresaId, limite);
    res.json(importacoes);
  } catch (err) {
    next(err);
  }
}
