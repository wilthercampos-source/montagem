import { Request, Response, NextFunction } from "express";
import { extrairInfoCliente } from "@/lib/requestInfo";
import { criarContaSchema, loginSchema } from "./auth.validation";
import * as authService from "./auth.service";

export async function criarContaController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = criarContaSchema.parse(req.body);
    const cliente = extrairInfoCliente(req);
    const resultado = await authService.criarConta(input, cliente);
    res.status(201).json(resultado);
  } catch (err) {
    next(err);
  }
}

export async function loginController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = loginSchema.parse(req.body);
    const cliente = extrairInfoCliente(req);
    const resultado = await authService.login(input, cliente);
    res.json(resultado);
  } catch (err) {
    next(err);
  }
}
