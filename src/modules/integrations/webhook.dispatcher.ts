import { prisma } from "@/lib/prisma";

interface ConfiguracaoWebhook {
  url?: string;
}

/**
 * Dispara um evento para o webhook configurado pela empresa (se a
 * integração "Webhooks" estiver conectada e tiver uma URL definida).
 * Nunca lança erro para o chamador — falha de rede em um webhook não
 * pode derrubar o fluxo principal (ex: gerar um alerta).
 */
export async function dispararWebhook(
  empresaId: string,
  evento: string,
  payload: Record<string, unknown>
) {
  try {
    const integracao = await prisma.integracao.findUnique({
      where: { empresaId_tipo: { empresaId, tipo: "WEBHOOK" } },
    });

    if (!integracao?.conectado) return;

    const config = (integracao.configuracao ?? {}) as ConfiguracaoWebhook;
    if (!config.url) return;

    await fetch(config.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ evento, empresaId, disparadoEm: new Date().toISOString(), payload }),
    });
  } catch (err) {
    console.error(`[WEBHOOK] Falha ao disparar evento "${evento}" para empresa ${empresaId}:`, err);
  }
}
