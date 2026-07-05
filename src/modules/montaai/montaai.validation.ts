import { z } from "zod";

export const perguntarMontaAISchema = z.object({
  texto: z.string().min(3, "Escreva um comando ou pergunta mais completo."),
});
