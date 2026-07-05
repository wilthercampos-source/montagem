import { z } from "zod";

export const criarUsuarioSchema = z.object({
  nome: z.string().min(2),
  email: z.string().email(),
  senha: z.string().min(6),
  perfil: z.enum(["USUARIO_MASTER", "GESTOR", "ANALISTA", "OPERADOR"]),
  departamento: z.string().optional(),
});

export const atualizarUsuarioSchema = z.object({
  nome: z.string().min(2).optional(),
  perfil: z.enum(["USUARIO_MASTER", "GESTOR", "ANALISTA", "OPERADOR"]).optional(),
  departamento: z.string().optional(),
  status: z.enum(["ATIVO", "INATIVO", "BLOQUEADO"]).optional(),
  fotoUrl: z.string().url().optional(),
});

export type CriarUsuarioInput = z.infer<typeof criarUsuarioSchema>;
export type AtualizarUsuarioInput = z.infer<typeof atualizarUsuarioSchema>;
