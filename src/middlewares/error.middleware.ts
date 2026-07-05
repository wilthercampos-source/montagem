import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export class ErroAplicacao extends Error {
  status: number;
  constructor(mensagem: string, status = 400) {
    super(mensagem);
    this.status = status;
  }
}

export function tratarErros(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(422).json({
      erro: "Dados inválidos.",
      detalhes: err.errors.map((e) => ({ campo: e.path.join("."), mensagem: e.message })),
    });
  }

  if (err instanceof ErroAplicacao) {
    return res.status(err.status).json({ erro: err.message });
  }

  console.error("[ERRO NÃO TRATADO]", err);
  return res.status(500).json({ erro: "Erro interno do servidor." });
}
