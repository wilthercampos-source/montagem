import { Response, NextFunction } from "express";
import { RequestAutenticado } from "@/middlewares/auth.middleware";
import { extrairInfoCliente } from "@/lib/requestInfo";
import { criarUsuarioSchema, atualizarUsuarioSchema } from "./users.validation";
import * as usersService from "./users.service";

export async function listarUsuariosController(req: RequestAutenticado, res: Response, next: NextFunction) {
  try {
    const usuarios = await usersService.listarUsuarios(req.usuario!.empresaId);
    res.json(usuarios);
  } catch (err) {
    next(err);
  }
}

export async function criarUsuarioController(req: RequestAutenticado, res: Response, next: NextFunction) {
  try {
    const input = criarUsuarioSchema.parse(req.body);
    const cliente = extrairInfoCliente(req);
    const usuario = await usersService.criarUsuario(req.usuario!.empresaId, req.usuario!.usuarioId, input, cliente);
    res.status(201).json(usuario);
  } catch (err) {
    next(err);
  }
}

export async function atualizarUsuarioController(req: RequestAutenticado, res: Response, next: NextFunction) {
  try {
    const input = atualizarUsuarioSchema.parse(req.body);
    const cliente = extrairInfoCliente(req);
    const usuario = await usersService.atualizarUsuario(
      req.usuario!.empresaId,
      req.params.id,
      req.usuario!.usuarioId,
      input,
      cliente
    );
    res.json(usuario);
  } catch (err) {
    next(err);
  }
}

export async function excluirUsuarioController(req: RequestAutenticado, res: Response, next: NextFunction) {
  try {
    const cliente = extrairInfoCliente(req);
    await usersService.excluirUsuario(req.usuario!.empresaId, req.params.id, req.usuario!.usuarioId, cliente);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
