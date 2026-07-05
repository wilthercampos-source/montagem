import { RotinaImportacao } from "@prisma/client";

/**
 * Cada rotina do ERP exporta um CSV com colunas específicas.
 * Esta configuração define o contrato esperado por rotina,
 * usado para validar o arquivo antes de processá-lo.
 */
export const CONFIG_ROTINAS: Record<
  RotinaImportacao,
  { label: string; colunasObrigatorias: string[] }
> = {
  ROTINA_901: {
    label: "Rotina 901 — Cadastro de cargas e volumes",
    colunasObrigatorias: ["codigoCarga", "cidade", "volumePrevisto", "dataProgramada"],
  },
  ROTINA_8072: {
    label: "Rotina 8072 — Status de montagem por cidade",
    colunasObrigatorias: ["codigoCarga", "cidade", "percentualMontado", "statusMontagem"],
  },
  ROTINA_8268: {
    label: "Rotina 8268 — Fechamento e conferência final",
    colunasObrigatorias: ["codigoCarga", "cidade", "percentualFinal", "horarioFechamento"],
  },
};

export function rotinaValida(valor: string): valor is RotinaImportacao {
  return Object.keys(CONFIG_ROTINAS).includes(valor);
}
