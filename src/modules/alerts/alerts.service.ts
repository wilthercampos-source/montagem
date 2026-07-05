import { prisma } from "@/lib/prisma";
import { registrarAuditoria } from "@/modules/audit/audit.service";
import { InfoCliente } from "@/lib/requestInfo";
import { ErroAplicacao } from "@/middlewares/error.middleware";
import { obterDashboard } from "@/modules/dashboard/dashboard.service";
import { dispararWebhook } from "@/modules/integrations/webhook.dispatcher";

/**
 * Gera (ou reaproveita) alertas com base no estado atual do Dashboard.
 * Evita duplicar um alerta já ativo para a mesma cidade — se a cidade
 * já tem um alerta não resolvido, apenas o mantém.
 * Chamado sob demanda (ex: ao abrir a tela de Alertas) — Sprint 05+ pode
 * evoluir para um job agendado.
 */
export async function sincronizarAlertas(empresaId: string) {
  const dashboard = await obterDashboard(empresaId);
  if (!dashboard.possuiDados) return;

  const alertasAtivos = await prisma.alerta.findMany({
    where: { empresaId, resolvido: false },
  });
  const cidadesComAlertaAtivo = new Set(alertasAtivos.map((a) => a.cidade));

  for (const alerta of dashboard.alertas) {
    if (cidadesComAlertaAtivo.has(alerta.cidade)) continue;

    const criado = await prisma.alerta.create({
      data: {
        empresaId,
        cidade: alerta.cidade,
        severidade: alerta.percentual < 40 ? "CRITICO" : "ATENCAO",
        mensagem: alerta.mensagem,
      },
    });

    await registrarAuditoria({
      empresaId,
      acao: "ALERTA_GERADO",
      detalhes: { cidade: criado.cidade, severidade: criado.severidade },
    });

    await dispararWebhook(empresaId, "alerta.gerado", {
      cidade: criado.cidade,
      severidade: criado.severidade,
      mensagem: criado.mensagem,
    });
  }
}

export async function listarAlertas(empresaId: string, filtro: "ativos" | "resolvidos" | "todos") {
  await sincronizarAlertas(empresaId);

  return prisma.alerta.findMany({
    where: {
      empresaId,
      ...(filtro === "ativos" ? { resolvido: false } : {}),
      ...(filtro === "resolvidos" ? { resolvido: true } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { resolvidoPor: { select: { nome: true } } },
  });
}

export async function resolverAlerta(
  empresaId: string,
  alertaId: string,
  usuarioId: string,
  cliente: InfoCliente
) {
  const alerta = await prisma.alerta.findFirst({ where: { id: alertaId, empresaId } });
  if (!alerta) throw new ErroAplicacao("Alerta não encontrado.", 404);
  if (alerta.resolvido) throw new ErroAplicacao("Este alerta já foi resolvido.", 400);

  const atualizado = await prisma.alerta.update({
    where: { id: alertaId },
    data: { resolvido: true, resolvidoPorId: usuarioId, resolvidoEm: new Date() },
  });

  await registrarAuditoria({
    empresaId,
    usuarioId,
    acao: "ALERTA_RESOLVIDO",
    detalhes: { cidade: alerta.cidade, alertaId },
    ip: cliente.ip,
    userAgent: cliente.userAgent,
  });

  return atualizado;
}
