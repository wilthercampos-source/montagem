import { z } from "zod";

export const perguntarSchema = z.object({
  pergunta: z.string().min(3, "Escreva uma pergunta mais completa."),
});

export type PerguntarInput = z.infer<typeof perguntarSchema>;
