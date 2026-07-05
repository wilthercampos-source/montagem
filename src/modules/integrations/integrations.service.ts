import { IntegracaoTipo } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria } from "@/modules/audit/audit.service";
import { InfoCliente } from "@/lib/requestInfo";
import { ErroAplicacao } from "@/middlewares/error.middleware";

const NOMES_PADRAO: Record<IntegracaoTipo, string> = {
  ERP: "ERP (901/8072/8268)",
  WHATSAPP: "WhatsApp Business",
  EMAIL: "E-mail (SMTP)",
  POWERBI: "Power BI",
  WEBHOOK: "Webhooks",
};

/**
 * Garante que a empresa tenha uma linha para cada tipo de integração
 * suportado (evita ter que rodar um seed manual por tenant).
 */
async function garantirIntegracoesPadrao(empresaId: string) {
  const existentes = await prisma.integracao.findMany({ where: { empresaId }, select: { tipo: true } });
  const tiposExistentes = new Set(existentes.map((i) => i.tipo));
  const faltantes = (Object.keys(NOMES_PADRAO) as IntegracaoTipo[]).filter((t) => !tiposExistentes.has(t));

  if (faltantes.length > 0) {
    await prisma.integracao.createMany({
      data: faltantes.map((tipo) => ({ empresaId, tipo, nome: NOMES_PADRAO[tipo], conectado: false })),
      skipDuplicates: true,
    });
  }
}

export async function listarIntegracoes(empresaId: string) {
  await garantirIntegracoesPadrao(empresaId);
  return prisma.integracao.findMany({ where: { empresaId }, orderBy: { tipo: "asc" } });
}

export async function alternarIntegracao(
  empresaId: string,
  tipo: IntegracaoTipo,
  usuarioId: string,
  cliente: InfoCliente
) {
  await garantirIntegracoesPadrao(empresaId);
  const atual = await prisma.integracao.findUnique({ where: { empresaId_tipo: { empresaId, tipo } } });
  if (!atual) throw new ErroAplicacao("Integração não encontrada.", 404);

  const atualizada = await prisma.integracao.update({
    where: { empresaId_tipo: { empresaId, tipo } },
    data: { conectado: !atual.conectado },
  });

  await registrarAuditoria({
    empresaId,
    usuarioId,
    acao: "INTEGRACAO_ALTERADA",
    detalhes: { tipo, conectado: atualizada.conectado },
    ip: cliente.ip,
    userAgent: cliente.userAgent,
  });

  return atualizada;
}

export async function atualizarConfiguracao(
  empresaId: string,
  tipo: IntegracaoTipo,
  configuracao: Record<string, unknown>,
  usuarioId: string,
  cliente: InfoCliente
) {
  await garantirIntegracoesPadrao(empresaId);

  const atualizada = await prisma.integracao.update({
    where: { empresaId_tipo: { empresaId, tipo } },
    data: { configuracao },
  });

  await registrarAuditoria({
    empresaId,
    usuarioId,
    acao: "INTEGRACAO_ALTERADA",
    detalhes: { tipo, evento: "configuracao_atualizada" },
    ip: cliente.ip,
    userAgent: cliente.userAgent,
  });

  return atualizada;
}
