import { prisma } from "@/lib/prisma";

export type TipoEventoTimeline = "importacao" | "alerta" | "operacao" | "sistema";

interface EventoTimeline {
  hora: Date;
  tipo: TipoEventoTimeline;
  texto: string;
}

const ACOES_IMPORTACAO = new Set(["IMPORTACAO_REALIZADA"]);
const ACOES_ALERTA = new Set(["ALERTA_GERADO", "ALERTA_RESOLVIDO"]);

/**
 * Constrói o feed cronológico completo da operação, unificando:
 *  - Auditoria (login, importações, configurações, etc.)
 *  - Alertas (gerados e resolvidos)
 * em uma única linha do tempo ordenada, filtrável por tipo.
 */
export async function obterTimeline(empresaId: string, tipo?: TipoEventoTimeline, limite = 100) {
  const auditorias = await prisma.auditoria.findMany({
    where: { empresaId },
    orderBy: { createdAt: "desc" },
    take: limite,
    include: { usuario: { select: { nome: true } } },
  });

  const eventos: EventoTimeline[] = auditorias.map((a) => {
    let tipoEvento: TipoEventoTimeline = "sistema";
    if (ACOES_IMPORTACAO.has(a.acao)) tipoEvento = "importacao";
    else if (ACOES_ALERTA.has(a.acao)) tipoEvento = "alerta";
    else if (a.acao === "LOGIN" || a.acao === "LOGOUT") tipoEvento = "sistema";
    else tipoEvento = "operacao";

    return {
      hora: a.createdAt,
      tipo: tipoEvento,
      texto: descreverAcao(a.acao, a.usuario?.nome, a.detalhes),
    };
  });

  eventos.sort((a, b) => b.hora.getTime() - a.hora.getTime());

  const filtrados = tipo ? eventos.filter((e) => e.tipo === tipo) : eventos;
  return filtrados.slice(0, limite);
}

function descreverAcao(acao: string, nomeUsuario: string | undefined, detalhes: unknown): string {
  const quem = nomeUsuario ?? "Sistema";
  const d = (detalhes ?? {}) as Record<string, unknown>;

  switch (acao) {
    case "LOGIN":
      return `${quem} realizou login.`;
    case "LOGIN_FALHO":
      return `Tentativa de login falhou (${(d.tentativasFalhas as number) ?? "?"} tentativa(s)).`;
    case "LOGIN_BLOQUEADO":
      return `Login bloqueado após tentativas incorretas.`;
    case "USUARIO_CRIADO":
      return `${quem} criou o usuário ${d.usuarioCriado ?? ""}.`;
    case "USUARIO_ATUALIZADO":
      return `${quem} atualizou o usuário ${d.usuarioAlvo ?? ""}.`;
    case "USUARIO_EXCLUIDO":
      return `${quem} removeu o usuário ${d.usuarioExcluido ?? ""}.`;
    case "CONFIGURACAO_ALTERADA":
      return `${quem} alterou configurações (${((d.campos as string[]) ?? []).join(", ")}).`;
    case "IMPORTACAO_REALIZADA":
      return d.evento === "processamento_concluido"
        ? `Importação processada — Snapshot ${d.snapshot} gerado.`
        : `${quem} importou ${d.arquivo} (${d.status}).`;
    case "ALERTA_GERADO":
      return `Alerta gerado para ${d.cidade} (${d.severidade}).`;
    case "ALERTA_RESOLVIDO":
      return `${quem} resolveu o alerta de ${d.cidade}.`;
    default:
      return `${quem}: ${acao}`;
  }
}
