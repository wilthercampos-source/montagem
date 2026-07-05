import { prisma } from "@/lib/prisma";
import { metaInteligentePlaceholder } from "@/modules/dashboard/decision-engine";

const JANELA_DIAS = 30;

/**
 * MOTOR DE DECISÃO — V2 (Sprint 04)
 * ----------------------------------
 * Substitui o placeholder fixo do Sprint 03 (`metaInteligentePlaceholder`)
 * por um cálculo real baseado nos últimos 30 dias de `IndicadorDiario`
 * (alimentado pelo fechamento da Rotina 8268 — ver imports.service.ts).
 *
 * Enquanto a empresa não tiver pelo menos alguns dias de histórico, cai de
 * volta no placeholder do Sprint 03 para não deixar o Dashboard vazio.
 */
export async function metaInteligenteHistorica(empresaId: string): Promise<number> {
  const desde = new Date();
  desde.setDate(desde.getDate() - JANELA_DIAS);

  const indicadores = await prisma.indicadorDiario.findMany({
    where: { empresaId, data: { gte: desde } },
    select: { percentualFinal: true },
  });

  if (indicadores.length === 0) return metaInteligentePlaceholder();

  const media = indicadores.reduce((a, i) => a + i.percentualFinal, 0) / indicadores.length;
  return Math.round(media);
}

/**
 * Confiabilidade histórica: percentual de dias, nos últimos 30, em que a
 * cidade/empresa NÃO ficou marcada como atrasada no fechamento.
 */
export async function confiabilidadeHistorica(empresaId: string): Promise<number | null> {
  const desde = new Date();
  desde.setDate(desde.getDate() - JANELA_DIAS);

  const indicadores = await prisma.indicadorDiario.findMany({
    where: { empresaId, data: { gte: desde } },
    select: { atrasado: true },
  });

  if (indicadores.length === 0) return null;

  const noPrazo = indicadores.filter((i) => !i.atrasado).length;
  return Math.round((noPrazo / indicadores.length) * 100);
}

/**
 * DNA Operacional: características recorrentes da operação, calculadas a
 * partir do histórico de fechamentos diários por cidade.
 */
export async function dnaOperacional(empresaId: string) {
  const desde = new Date();
  desde.setDate(desde.getDate() - JANELA_DIAS);

  const indicadores = await prisma.indicadorDiario.findMany({
    where: { empresaId, data: { gte: desde } },
  });

  if (indicadores.length === 0) {
    return { possuiDados: false, mensagem: "Histórico insuficiente. O DNA Operacional é calculado a partir dos fechamentos diários (Rotina 8268)." };
  }

  const porCidade = new Map<string, typeof indicadores>();
  for (const ind of indicadores) {
    const lista = porCidade.get(ind.cidade) ?? [];
    lista.push(ind);
    porCidade.set(ind.cidade, lista);
  }

  let cidadeMaisConsistente: string | null = null;
  let menorVariancia = Infinity;
  let cidadeMaisVariavel: string | null = null;
  let maiorVariancia = -Infinity;

  for (const [cidade, lista] of porCidade) {
    const percentuais = lista.map((l) => l.percentualFinal);
    const media = percentuais.reduce((a, b) => a + b, 0) / percentuais.length;
    const variancia = percentuais.reduce((a, p) => a + (p - media) ** 2, 0) / percentuais.length;

    if (variancia < menorVariancia) {
      menorVariancia = variancia;
      cidadeMaisConsistente = cidade;
    }
    if (variancia > maiorVariancia) {
      maiorVariancia = variancia;
      cidadeMaisVariavel = cidade;
    }
  }

  const totalDias = indicadores.length;
  const diasAtrasados = indicadores.filter((i) => i.atrasado).length;
  const taxaMediaAtraso = Math.round((diasAtrasados / totalDias) * 100);

  return {
    possuiDados: true,
    cidadeMaisConsistente,
    cidadeMaisVariavel,
    taxaMediaAtraso,
    diasAnalisados: new Set(indicadores.map((i) => i.data.toISOString().slice(0, 10))).size,
  };
}
