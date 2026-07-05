import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { agruparPorCidade, Registro8268 } from "@/modules/dashboard/snapshot-reader";
import { estaAtrasado, metaEsperadaParaAgora } from "@/modules/dashboard/decision-engine";

/**
 * Sempre que um Snapshot da Rotina 8268 (fechamento e conferência final)
 * é gerado, consolidamos um IndicadorDiario por cidade. Essa é a fonte de
 * dados histórica usada pelo Motor de Decisão (Meta Inteligente,
 * Confiabilidade, DNA Operacional) — nunca é recalculada retroativamente,
 * apenas acumulada dia após dia.
 */
export async function registrarIndicadoresDoFechamento(
  empresaId: string,
  dadosSnapshot: Prisma.JsonValue
) {
  const registros = (dadosSnapshot as unknown as Registro8268[]) ?? [];
  if (!Array.isArray(registros) || registros.length === 0) return;

  const porCidade = agruparPorCidade(registros);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const metaEsperada = metaEsperadaParaAgora(new Date(new Date().setHours(19, 59, 0, 0)));

  for (const [cidade, linhas] of porCidade) {
    const cargasTotais = linhas.length;
    const percentuais = linhas.map((l) => Number(l.percentualFinal) || 0);
    const percentualFinal = Math.round(percentuais.reduce((a, b) => a + b, 0) / cargasTotais);
    const cargasConcluidas = percentuais.filter((p) => p >= 100).length;

    await prisma.indicadorDiario.upsert({
      where: { empresaId_cidade_data: { empresaId, cidade, data: hoje } },
      update: {
        cargasTotais,
        cargasConcluidas,
        percentualFinal,
        atrasado: estaAtrasado(percentualFinal, metaEsperada),
      },
      create: {
        empresaId,
        cidade,
        data: hoje,
        cargasTotais,
        cargasConcluidas,
        percentualFinal,
        atrasado: estaAtrasado(percentualFinal, metaEsperada),
      },
    });
  }
}
