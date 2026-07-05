import { RotinaImportacao } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface Registro901 {
  codigoCarga: string;
  cidade: string;
  volumePrevisto: string;
  dataProgramada: string;
}

export interface Registro8072 {
  codigoCarga: string;
  cidade: string;
  percentualMontado: string;
  statusMontagem: string;
}

export interface Registro8268 {
  codigoCarga: string;
  cidade: string;
  percentualFinal: string;
  horarioFechamento: string;
}

/**
 * Busca o Snapshot mais recente de uma rotina específica para a empresa.
 * Snapshots só existem para importações concluídas (ver Sprint 02),
 * então isto sempre reflete o último dado consolidado e válido.
 */
export async function ultimoSnapshot(empresaId: string, rotina: RotinaImportacao) {
  return prisma.snapshot.findFirst({
    where: { empresaId, importacao: { rotina } },
    orderBy: { createdAt: "desc" },
    include: { importacao: true },
  });
}

/**
 * Busca os N snapshots mais recentes de uma rotina, do mais novo ao mais
 * antigo. Usado para comparativos (hoje x snapshot anterior).
 */
export async function ultimosSnapshots(empresaId: string, rotina: RotinaImportacao, quantidade: number) {
  return prisma.snapshot.findMany({
    where: { empresaId, importacao: { rotina } },
    orderBy: { createdAt: "desc" },
    take: quantidade,
    include: { importacao: true },
  });
}

export function agruparPorCidade<T extends { cidade: string }>(linhas: T[]): Map<string, T[]> {
  const mapa = new Map<string, T[]>();
  for (const linha of linhas) {
    const lista = mapa.get(linha.cidade) ?? [];
    lista.push(linha);
    mapa.set(linha.cidade, lista);
  }
  return mapa;
}
