import { prisma } from "@/lib/prisma";

interface DetalhesNotificacao {
  usuarioAlvo: string;
  ip: string;
  userAgent: string;
  sistemaOperacional: string;
  navegador: string;
  dataHora: Date;
}

/**
 * Notifica o(s) Usuário(s) Master da empresa sobre uma tentativa de
 * login suspeita (falha repetida após bloqueio).
 *
 * Sprint 01: estrutura preparada, log estruturado no servidor.
 * Sprints futuros: plugar provedor de e-mail/SMS/push (ex: SES, Twilio)
 * mantendo esta função como único ponto de entrada.
 */
export async function notificarUsuarioMaster(empresaId: string, detalhes: DetalhesNotificacao) {
  const masters = await prisma.usuario.findMany({
    where: { empresaId, perfil: "USUARIO_MASTER", status: "ATIVO" },
    select: { id: true, nome: true, email: true },
  });

  for (const master of masters) {
    // TODO (Sprint futuro): enviar e-mail/push real para master.email
    console.warn(
      `[ALERTA DE SEGURANÇA] Usuário Master ${master.nome} <${master.email}> notificado: ` +
        `tentativa de login repetida para "${detalhes.usuarioAlvo}" em ${detalhes.dataHora.toISOString()} ` +
        `via IP ${detalhes.ip} (${detalhes.sistemaOperacional} / ${detalhes.navegador}).`
    );
  }

  return masters;
}
