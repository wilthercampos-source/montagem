import { z } from "zod";

export const simularCenarioSchema = z.object({
  cidade: z.string().min(1),
  reforcoEquipe: z.number().int().min(0).max(10).default(0),
  ajusteMetaPp: z.number().int().min(-30).max(30).default(0),
});

export type SimularCenarioInput = z.infer<typeof simularCenarioSchema>;
