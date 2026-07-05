import { AcaoAuditoria, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

interface RegistrarAuditoriaParams {
  empresaId: string;
  usuarioId?: string | null;
  acao: AcaoAuditoria;
  detalhes?: Prisma.InputJsonValue;
  ip?: string;
  userAgent?: string;
}

/**
 * Registra uma entrada de auditoria. Nunca deve ser deletada (histórico
 * completo é requisito do sistema). Chamado por todos os módulos que
 * executam ações sensíveis: login, usuários, configurações, etc.
 */
export async function registrarAuditoria(params: RegistrarAuditoriaParams) {
  return prisma.auditoria.create({
    data: {
      empresaId: params.empresaId,
      usuarioId: params.usuarioId ?? null,
      acao: params.acao,
      detalhes: params.detalhes,
      ip: params.ip,
      userAgent: params.userAgent,
    },
  });
}

export async function listarAuditoria(empresaId: string, limite = 50) {
  return prisma.auditoria.findMany({
    where: { empresaId },
    orderBy: { createdAt: "desc" },
    take: limite,
    include: {
      usuario: { select: { nome: true, email: true } },
    },
  });
}
