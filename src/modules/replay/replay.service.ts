import { prisma } from "@/lib/prisma";
import { ultimoSnapshot, agruparPorCidade, Registro901, Registro8072 } from "@/modules/dashboard/snapshot-reader";
import { estaAtrasado, metaEsperadaParaAgora } from "@/modules/dashboard/decision-engine";

/**
 * REPLAY (Sprint 05)
 * -------------------
 * Não existe uma tabela nova para o Replay: ele reaproveita o histórico
 * de Snapshots já criado no Sprint 02 (cada importação da Rotina 8072
 * processada ao longo do dia gera um novo Snapshot). O Replay simplesmente
 * escolhe o snapshot mais próximo, no passado, do instante solicitado.
 */

/** Lista os instantes (timestamps) em que há um snapshot da Rotina 8072 — usados para preencher o seletor de tempo do Replay. */
export async function listarMomentosDisponiveis(empresaId: string, data?: Date) {
  const inicio = data ? new Date(data) : new Date();
  inicio.setHours(0, 0, 0, 0);
  const fim = new Date(inicio);
  fim.setDate(fim.getDate() + 1);

  const snapshots = await prisma.snapshot.findMany({
    where: {
      empresaId,
      importacao: { rotina: "ROTINA_8072" },
      createdAt: { gte: inicio, lt: fim },
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, codigo: true, createdAt: true },
  });

  return snapshots;
}

/**
 * Reconstrói o estado da operação por cidade no instante `timestamp`,
 * usando o snapshot da Rotina 8072 mais recente até aquele momento,
 * combinado com o cadastro de cargas (Rotina 901) mais recente disponível.
 */
export async function estadoNoInstante(empresaId: string, timestamp: Date) {
  const [snapshot8072, snapshot901] = await Promise.all([
    prisma.snapshot.findFirst({
      where: { empresaId, importacao: { rotina: "ROTINA_8072" }, createdAt: { lte: timestamp } },
      orderBy: { createdAt: "desc" },
    }),
    ultimoSnapshot(empresaId, "ROTINA_901"),
  ]);

  if (!snapshot8072 || !snapshot901) {
    return {
      possuiDados: false,
      mensagem: "Não há snapshot disponível até este instante. Escolha um horário posterior à primeira importação do dia.",
    };
  }

  const cargas901 = (snapshot901.dados as unknown as Registro901[]) ?? [];
  const status8072 = (snapshot8072.dados as unknown as Registro8072[]) ?? [];

  const porCidade901 = agruparPorCidade(cargas901);
  const porCidade8072 = agruparPorCidade(status8072);
  const metaEsperada = metaEsperadaParaAgora(timestamp);

  const cidades = Array.from(porCidade901.entries()).map(([cidade, cargas]) => {
    const statusCidade = porCidade8072.get(cidade) ?? [];
    const percentuais = statusCidade.map((s) => Number(s.percentualMontado) || 0);
    const percentual = percentuais.length ? Math.round(percentuais.reduce((a, b) => a + b, 0) / percentuais.length) : 0;
    const concluidas = percentuais.filter((p) => p >= 100).length;

    return {
      cidade,
      cargas: cargas.length,
      concluidas,
      percentual,
      atraso: estaAtrasado(percentual, metaEsperada),
    };
  });

  return {
    possuiDados: true,
    timestamp,
    snapshotUtilizado: snapshot8072.codigo,
    cidades,
  };
}
