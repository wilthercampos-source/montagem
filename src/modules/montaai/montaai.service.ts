import { responderPergunta } from "@/modules/intelligence/ai.service";
import { simularCenario } from "@/modules/simulations/simulations.service";
import { obterDashboard } from "@/modules/dashboard/dashboard.service";
import { InfoCliente } from "@/lib/requestInfo";

/**
 * MONTA AI (Sprint 06)
 * ---------------------
 * Diferença em relação ao Motor de IA (Sprint 04, `intelligence/ai.service`):
 * o Motor de IA só responde perguntas. O Monta AI interpreta a intenção e,
 * quando aplicável, **executa uma ação real** no sistema (rodar uma
 * simulação, por exemplo) antes de responder — devolvendo tanto o texto
 * quanto o resultado estruturado da ação.
 *
 * Esta é uma primeira versão por palavras-chave, com a mesma ressalva do
 * Motor de IA: pode ser substituída por um LLM real (function calling)
 * sem mudar o contrato da rota `/api/monta-ai/perguntar`.
 */
export async function processarComando(
  empresaId: string,
  usuarioId: string,
  texto: string,
  cliente: InfoCliente
) {
  const p = texto.toLowerCase();

  if (p.includes("simular") || p.includes("reforço") || p.includes("reforco")) {
    const dashboard = await obterDashboard(empresaId);
    if (!dashboard.possuiDados) {
      return { resposta: "Ainda não há dados suficientes para simular. Importe as rotinas 901 e 8072 primeiro." };
    }
    const piorCidade = [...dashboard.radarOperacional].sort((a, b) => a.percentual - b.percentual)[0];

    const resultado = await simularCenario(
      empresaId,
      usuarioId,
      { cidade: piorCidade.cidade, reforcoEquipe: 2, ajusteMetaPp: 0 },
      cliente
    );

    return {
      resposta: `Simulei um reforço de 2 times em ${resultado.cidade}: o percentual estimado sobe de ${resultado.atual.percentual}% para ${resultado.simulado.percentual}%.`,
      acao: "simulacao",
      resultado,
    };
  }

  if (p.includes("relatório") || p.includes("relatorio")) {
    return {
      resposta: "Para gerar o relatório, use os endpoints /api/relatorios/excel ou /api/relatorios/pdf — o Monta AI aponta o caminho, mas o download é feito diretamente por eles para não trafegar arquivos binários dentro do chat.",
      acao: "apontar-relatorio",
      links: { excel: "/api/relatorios/excel", pdf: "/api/relatorios/pdf" },
    };
  }

  // Sem intenção de ação identificada: cai para o Motor de IA (Sprint 04).
  const resposta = await responderPergunta(empresaId, texto);
  return { ...resposta, acao: "resposta" };
}
