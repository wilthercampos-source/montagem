import { prisma } from "@/lib/prisma";
import {
  ultimoSnapshot,
  ultimosSnapshots,
  agruparPorCidade,
  Registro901,
  Registro8072,
} from "./snapshot-reader";
import {
  metaEsperadaParaAgora,
  estaAtrasado,
  saudeOperacional,
  preverEncerramento,
  confiabilidade,
} from "./decision-engine";
import { metaInteligenteHistorica, confiabilidadeHistorica } from "@/modules/intelligence/decision-engine-v2";

interface CidadeAgregada {
  cidade: string;
  cargas: number;
  concluidas: number;
  percentual: number;
  atraso: boolean;
  prioridade: number;
}

interface DashboardIndicadores {
  saudeOperacional: { label: string; cor: string };
  percentualGeral: number;
  metaInteligente: number;
  metaEsperadaParaHorario: number;
  previsaoEncerramento: string;
  confiabilidade: number;
}

interface DashboardAlerta { cidade: string; percentual: number; mensagem: string }
interface DashboardLinhaDoTempo { hora: Date; usuario: string; acao: string; detalhes: unknown }

export type DashboardResultado =
  | { possuiDados: false; mensagem: string }
  | {
      possuiDados: true;
      indicadores: DashboardIndicadores;
      radarOperacional: CidadeAgregada[];
      ranking: CidadeAgregada[];
      alertas: DashboardAlerta[];
      comparativo: { hojePercentual: number; ontemPercentual: number | null };
      resumoIA: string;
      linhaDoTempo: DashboardLinhaDoTempo[];
    };

export type PreviaResultado =
  | { possuiDados: false; resumo: { emAndamento: 0; concluidas: 0; atrasadas: 0 }; cidades: [] }
  | {
      possuiDados: true;
      resumo: { emAndamento: number; concluidas: number; atrasadas: number };
      cidades: CidadeAgregada[];
    };

interface PrePreviaLinha { cidade: string; volumeEsperado: number; cargasProgramadas: number; demanda: "Alta" | "Média" | "Baixa" }

export type PrePreviaResultado =
  | { possuiDados: false; mensagem: string }
  | { possuiDados: true; data: string; cidades: PrePreviaLinha[] };

/**
 * Monta a visão por cidade combinando o cadastro de cargas (Rotina 901)
 * com o status de montagem (Rotina 8072) do snapshot mais recente de cada.
 * Se uma das duas rotinas ainda não tiver sido importada, retorna lista vazia
 * (o frontend deve orientar o usuário a importar os dados via Sprint 02).
 */
async function montarVisaoPorCidade(empresaId: string): Promise<CidadeAgregada[]> {
  const [snap901, snap8072] = await Promise.all([
    ultimoSnapshot(empresaId, "ROTINA_901"),
    ultimoSnapshot(empresaId, "ROTINA_8072"),
  ]);

  if (!snap901 || !snap8072) return [];

  const cargas901 = (snap901.dados as unknown as Registro901[]) ?? [];
  const status8072 = (snap8072.dados as unknown as Registro8072[]) ?? [];

  const porCidade901 = agruparPorCidade(cargas901);
  const porCidade8072 = agruparPorCidade(status8072);

  const metaEsperada = metaEsperadaParaAgora();
  const resultado: CidadeAgregada[] = [];

  for (const [cidade, cargas] of porCidade901) {
    const statusCidade = porCidade8072.get(cidade) ?? [];
    const percentuais = statusCidade.map((s) => Number(s.percentualMontado) || 0);
    const percentualMedio = percentuais.length
      ? Math.round(percentuais.reduce((a, b) => a + b, 0) / percentuais.length)
      : 0;
    const concluidas = percentuais.filter((p) => p >= 100).length;

    resultado.push({
      cidade,
      cargas: cargas.length,
      concluidas,
      percentual: percentualMedio,
      atraso: estaAtrasado(percentualMedio, metaEsperada),
      prioridade: 0, // definido após ordenação abaixo
    });
  }

  // Prioridade: cidades mais atrasadas em relação à meta primeiro.
  resultado.sort((a, b) => a.percentual - b.percentual);
  resultado.forEach((c, i) => (c.prioridade = i + 1));

  return resultado;
}

export async function obterDashboard(empresaId: string): Promise<DashboardResultado> {
  const cidades = await montarVisaoPorCidade(empresaId);

  if (cidades.length === 0) {
    return {
      possuiDados: false,
      mensagem: "Ainda não há dados suficientes. Importe as rotinas 901 e 8072 para gerar o Dashboard.",
    };
  }

  const totalCargas = cidades.reduce((a, c) => a + c.cargas, 0);
  const totalConcluidas = cidades.reduce((a, c) => a + c.concluidas, 0);
  const percentualGeral = totalCargas ? Math.round((totalConcluidas / totalCargas) * 100) : 0;
  const metaEsperada = metaEsperadaParaAgora();
  const saude = saudeOperacional(percentualGeral);

  const [snapHoje, snapOntem] = await ultimosSnapshots(empresaId, "ROTINA_8072", 2);
  const percentualOntem = snapOntem
    ? mediaPercentual((snapOntem.dados as unknown as Registro8072[]) ?? [])
    : null;

  const cidadesAtrasadas = cidades.filter((c) => c.atraso);
  const ranking = [...cidades].sort((a, b) => a.percentual - b.percentual).slice(0, 5);

  const [metaInteligente, confiabilidadeHist] = await Promise.all([
    metaInteligenteHistorica(empresaId),
    confiabilidadeHistorica(empresaId),
  ]);

  const auditoriasRecentes = await prisma.auditoria.findMany({
    where: { empresaId },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { usuario: { select: { nome: true } } },
  });

  return {
    possuiDados: true,
    indicadores: {
      saudeOperacional: saude,
      percentualGeral,
      metaInteligente,
      metaEsperadaParaHorario: metaEsperada,
      previsaoEncerramento: preverEncerramento(percentualGeral),
      // Confiabilidade histórica (30 dias) quando disponível; senão, cai na
      // aderência do dia atual à meta esperada para o horário (Sprint 03).
      confiabilidade: confiabilidadeHist ?? confiabilidade(percentualGeral, metaEsperada),
    },
    radarOperacional: cidades,
    ranking,
    alertas: cidadesAtrasadas.map((c) => ({
      cidade: c.cidade,
      percentual: c.percentual,
      mensagem: `${c.cidade} está atrasada em relação à meta esperada para o horário.`,
    })),
    comparativo: {
      hojePercentual: percentualGeral,
      ontemPercentual: percentualOntem,
    },
    resumoIA: gerarResumoTextual(saude, percentualGeral, cidadesAtrasadas),
    linhaDoTempo: auditoriasRecentes.map((a) => ({
      hora: a.createdAt,
      usuario: a.usuario?.nome ?? "Sistema",
      acao: a.acao,
      detalhes: a.detalhes,
    })),
  };
}

export async function obterPrevia(empresaId: string): Promise<PreviaResultado> {
  const cidades = await montarVisaoPorCidade(empresaId);

  if (cidades.length === 0) {
    return { possuiDados: false, resumo: { emAndamento: 0, concluidas: 0, atrasadas: 0 }, cidades: [] };
  }

  return {
    possuiDados: true,
    resumo: {
      emAndamento: cidades.filter((c) => !c.atraso && c.percentual < 100).length,
      concluidas: cidades.filter((c) => c.percentual >= 100).length,
      atrasadas: cidades.filter((c) => c.atraso).length,
    },
    cidades,
  };
}

/**
 * Pré-Prévia: planejamento do dia seguinte. Lê exclusivamente a Rotina 901
 * (cadastro de cargas), filtrando pela dataProgramada = amanhã. Nunca
 * cruza com dados da operação atual (Rotina 8072), conforme especificação
 * ("nunca interferir na operação atual").
 */
export async function obterPrePrevia(empresaId: string): Promise<PrePreviaResultado> {
  const snap901 = await ultimoSnapshot(empresaId, "ROTINA_901");
  if (!snap901) {
    return { possuiDados: false, mensagem: "Importe a Rotina 901 para visualizar o planejamento do dia seguinte." };
  }

  const amanha = new Date();
  amanha.setDate(amanha.getDate() + 1);
  const amanhaStr = amanha.toISOString().slice(0, 10);

  const registros = (snap901.dados as unknown as Registro901[]) ?? [];
  const programadasAmanha = registros.filter((r) => (r.dataProgramada ?? "").startsWith(amanhaStr));

  if (programadasAmanha.length === 0) {
    return { possuiDados: false, mensagem: "Nenhuma carga programada para amanhã na Rotina 901 ainda." };
  }

  const porCidade = agruparPorCidade(programadasAmanha);
  const linhas: PrePreviaLinha[] = Array.from(porCidade.entries()).map(([cidade, cargas]) => {
    const volumeEsperado = cargas.reduce((acc, c) => acc + (Number(c.volumePrevisto) || 0), 0);
    const demanda: PrePreviaLinha["demanda"] = volumeEsperado >= 30 ? "Alta" : volumeEsperado >= 15 ? "Média" : "Baixa";
    return { cidade, volumeEsperado, cargasProgramadas: cargas.length, demanda };
  });

  return { possuiDados: true, data: amanhaStr, cidades: linhas };
}

function mediaPercentual(registros: Registro8072[]): number {
  if (registros.length === 0) return 0;
  const soma = registros.reduce((a, r) => a + (Number(r.percentualMontado) || 0), 0);
  return Math.round(soma / registros.length);
}

function gerarResumoTextual(
  saude: { label: string },
  percentualGeral: number,
  atrasadas: CidadeAgregada[]
): string {
  if (atrasadas.length === 0) {
    return `A operação está ${saude.label.toLowerCase()}, com ${percentualGeral}% das cargas concluídas e nenhuma cidade fora da meta esperada.`;
  }
  const pior = [...atrasadas].sort((a, b) => a.percentual - b.percentual)[0];
  return `A operação está ${saude.label.toLowerCase()}, com ${percentualGeral}% das cargas concluídas. ${pior.cidade} é o ponto de maior atenção, com ${pior.percentual}% de conclusão.`;
}
