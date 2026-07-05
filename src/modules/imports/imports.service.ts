import { parse } from "csv-parse/sync";
import { RotinaImportacao } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ErroAplicacao } from "@/middlewares/error.middleware";
import { registrarAuditoria } from "@/modules/audit/audit.service";
import { InfoCliente } from "@/lib/requestInfo";
import { CONFIG_ROTINAS } from "./imports.config";
import { registrarIndicadoresDoFechamento } from "@/modules/intelligence/indicadores.service";
import { dispararWebhook } from "@/modules/integrations/webhook.dispatcher";

interface ArquivoUpload {
  originalname: string;
  size: number;
  buffer: Buffer;
}

/**
 * Recebe o arquivo, tenta fazer o parsing como CSV e valida se as
 * colunas obrigatórias da rotina estão presentes. O resultado (sucesso
 * ou erro) é persistido imediatamente como um registro de Importacao,
 * preservando o histórico mesmo em caso de falha.
 */
export async function uploadEValidar(
  empresaId: string,
  usuarioId: string,
  rotina: RotinaImportacao,
  arquivo: ArquivoUpload,
  cliente: InfoCliente
) {
  const config = CONFIG_ROTINAS[rotina];
  const erros: string[] = [];
  let registros: Record<string, string>[] = [];

  try {
    const texto = arquivo.buffer.toString("utf-8");
    registros = parse(texto, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  } catch {
    erros.push("Não foi possível ler o arquivo. Verifique se é um CSV válido.");
  }

  if (erros.length === 0) {
    if (registros.length === 0) {
      erros.push("O arquivo não contém registros.");
    } else {
      const colunasArquivo = Object.keys(registros[0]);
      const faltantes = config.colunasObrigatorias.filter((c) => !colunasArquivo.includes(c));
      if (faltantes.length > 0) {
        erros.push(
          `Colunas obrigatórias ausentes para ${config.label}: ${faltantes.join(", ")}.`
        );
      }
    }
  }

  const sucesso = erros.length === 0;

  const importacao = await prisma.importacao.create({
    data: {
      empresaId,
      criadoPorId: usuarioId,
      rotina,
      nomeArquivo: arquivo.originalname,
      tamanhoBytes: arquivo.size,
      status: sucesso ? "VALIDADO" : "ERRO",
      totalRegistros: sucesso ? registros.length : null,
      erros: sucesso ? undefined : erros,
      dadosValidados: sucesso ? registros : undefined,
    },
  });

  await registrarAuditoria({
    empresaId,
    usuarioId,
    acao: "IMPORTACAO_REALIZADA",
    detalhes: { arquivo: arquivo.originalname, rotina, status: importacao.status },
    ip: cliente.ip,
    userAgent: cliente.userAgent,
  });

  return importacao;
}

/**
 * Processa uma importação já validada: consolida os dados em um
 * Snapshot imutável e marca a importação como concluída.
 */
export async function processarImportacao(
  empresaId: string,
  importacaoId: string,
  usuarioId: string,
  cliente: InfoCliente
) {
  const importacao = await prisma.importacao.findFirst({
    where: { id: importacaoId, empresaId },
  });

  if (!importacao) {
    throw new ErroAplicacao("Importação não encontrada.", 404);
  }
  if (importacao.status !== "VALIDADO") {
    throw new ErroAplicacao("Somente importações validadas podem ser processadas.", 400);
  }

  const totalSnapshots = await prisma.snapshot.count({ where: { empresaId } });
  const codigo = `SNAP-${String(1000 + totalSnapshots + 1).padStart(4, "0")}`;

  const [snapshot] = await prisma.$transaction([
    prisma.snapshot.create({
      data: {
        empresaId,
        importacaoId: importacao.id,
        codigo,
        dados: importacao.dadosValidados ?? {},
      },
    }),
    prisma.importacao.update({
      where: { id: importacao.id },
      data: { status: "CONCLUIDO", dadosValidados: null },
    }),
  ]);

  await registrarAuditoria({
    empresaId,
    usuarioId,
    acao: "IMPORTACAO_REALIZADA",
    detalhes: { importacaoId: importacao.id, snapshot: codigo, evento: "processamento_concluido" },
    ip: cliente.ip,
    userAgent: cliente.userAgent,
  });

  // Rotina 8268 = fechamento do dia. Alimenta o histórico do Motor de
  // Decisão (Sprint 04) sempre que um fechamento é processado.
  if (importacao.rotina === "ROTINA_8268") {
    await registrarIndicadoresDoFechamento(empresaId, snapshot.dados);
  }

  await dispararWebhook(empresaId, "importacao.concluida", {
    rotina: importacao.rotina,
    arquivo: importacao.nomeArquivo,
    snapshot: codigo,
  });

  return { importacao: { ...importacao, status: "CONCLUIDO" as const }, snapshot };
}

export async function listarImportacoes(empresaId: string, limite = 50) {
  return prisma.importacao.findMany({
    where: { empresaId },
    orderBy: { createdAt: "desc" },
    take: limite,
    select: {
      id: true,
      rotina: true,
      nomeArquivo: true,
      status: true,
      totalRegistros: true,
      erros: true,
      createdAt: true,
      snapshot: { select: { codigo: true } },
      criadoPor: { select: { nome: true } },
    },
  });
}
