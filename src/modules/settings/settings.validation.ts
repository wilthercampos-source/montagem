import { z } from "zod";

export const atualizarEmpresaSchema = z.object({
  nome: z.string().min(2).optional(),
  logoUrl: z.string().url().optional(),
  unidade: z.string().optional(),
  idioma: z.string().optional(),
  moeda: z.string().optional(),
});

const HEX_COR = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

export const atualizarAparenciaSchema = z.object({
  tema: z.enum(["CLARO", "ESCURO", "PERSONALIZADO"]).optional(),
  corPrimaria: z.string().regex(HEX_COR).optional(),
  corSecundaria: z.string().regex(HEX_COR).optional(),
  corFundo: z.string().regex(HEX_COR).optional(),
  corCartoes: z.string().regex(HEX_COR).optional(),
  corTexto: z.string().regex(HEX_COR).optional(),
});

export const atualizarSegurancaSchema = z.object({
  loginMaxTentativas: z.number().int().min(1).max(10).optional(),
  loginBloqueioSeg: z.number().int().min(5).max(300).optional(),
});

export type AtualizarEmpresaInput = z.infer<typeof atualizarEmpresaSchema>;
export type AtualizarAparenciaInput = z.infer<typeof atualizarAparenciaSchema>;
export type AtualizarSegurancaInput = z.infer<typeof atualizarSegurancaSchema>;
