import { z } from "zod";

export const uploadImportacaoSchema = z.object({
  rotina: z.enum(["ROTINA_901", "ROTINA_8072", "ROTINA_8268"], {
    errorMap: () => ({ message: "Rotina inválida. Use ROTINA_901, ROTINA_8072 ou ROTINA_8268." }),
  }),
});

export type UploadImportacaoInput = z.infer<typeof uploadImportacaoSchema>;
