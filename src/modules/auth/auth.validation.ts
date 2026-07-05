import { z } from "zod";

export const criarContaSchema = z.object({
  nome: z.string().min(2, "Informe seu nome completo."),
  empresa: z.string().min(2, "Informe o nome da empresa."),
  email: z.string().email("E-mail inválido."),
  senha: z.string().min(6, "A senha deve ter no mínimo 6 caracteres."),
});

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido."),
  senha: z.string().min(1, "Informe a senha."),
});

export type CriarContaInput = z.infer<typeof criarContaSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
