import { z } from "zod";

export const tipoIntegracaoSchema = z.enum(["ERP", "WHATSAPP", "EMAIL", "POWERBI", "WEBHOOK"]);

export const atualizarConfiguracaoSchema = z.object({
  configuracao: z.record(z.unknown()),
});
