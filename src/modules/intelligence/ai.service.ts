import { obterDashboard } from "@/modules/dashboard/dashboard.service";
import { dnaOperacional } from "./decision-engine-v2";

/**
 * MOTOR DE IA — VERSÃO BASEADA EM REGRAS (Sprint 04)
 * -----------------------------------------------------
 * O prompt mestre define o "Motor de IA" como a capacidade de responder
 * perguntas em linguagem natural sobre a operação. Esta primeira versão
 * usa correspondência de palavras-chave sobre os dados já agregados do
 * Dashboard — sem depender de um provedor de LLM externo.
 *
 * Arquitetura preparada para evoluir: basta substituir `responder()` por
 * uma chamada a um LLM (passando o mesmo contexto de `obterDashboard` como
 * grounding), sem alterar o contrato da rota `/api/inteligencia/perguntar`.
 */
export async function responderPergunta(empresaId: string, pergunta: string) {
  const dashboard = await obterDashboard(empresaId);

  if (!dashboard.possuiDados) {
    return {
      resposta:
        "Ainda não há dados suficientes para responder. Importe as rotinas 901 e 8072 primeiro.",
    };
  }

  const p = pergunta.toLowerCase();
  const cidades = dashboard.radarOperacional;
  const pior = [...cidades].sort((a, b) => a.percentual - b.percentual)[0];
  const melhor = [...cidades].sort((a, b) => b.percentual - a.percentual)[0];

  if (p.includes("atrasad")) {
    return {
      resposta: `${pior.cidade} é a cidade mais atrasada, com ${pior.percentual}% concluído.`,
      referencia: { cidade: pior.cidade, percentual: pior.percentual },
    };
  }

  if (p.includes("que horas") || p.includes("termina") || p.includes("encerramento")) {
    return {
      resposta: `A previsão de encerramento geral da operação é às ${dashboard.indicadores.previsaoEncerramento}.`,
      referencia: { previsaoEncerramento: dashboard.indicadores.previsaoEncerramento },
    };
  }

  if (p.includes("prioridade") || p.includes("carga")) {
    const top3 = [...cidades].sort((a, b) => a.percentual - b.percentual).slice(0, 3);
    return {
      resposta: `As cargas com maior prioridade estão em: ${top3.map((c) => c.cidade).join(", ")}.`,
      referencia: { cidades: top3 },
    };
  }

  if (p.includes("compare") || p.includes("ontem")) {
    const { hojePercentual, ontemPercentual } = dashboard.comparativo;
    if (ontemPercentual === null) {
      return { resposta: "Ainda não há um snapshot anterior para comparar com hoje." };
    }
    const diferenca = hojePercentual - ontemPercentual;
    const direcao = diferenca >= 0 ? "melhor" : "pior";
    return {
      resposta: `Hoje a operação está em ${hojePercentual}%, contra ${ontemPercentual}% no mesmo ponto de ontem — ${Math.abs(diferenca)} pontos percentuais ${direcao}.`,
      referencia: dashboard.comparativo,
    };
  }

  if (p.includes("dna") || p.includes("consistente") || p.includes("variável") || p.includes("variavel")) {
    const dna = await dnaOperacional(empresaId);
    return { resposta: JSON.stringify(dna), referencia: dna };
  }

  return {
    resposta: `${melhor.cidade} está com o melhor desempenho (${melhor.percentual}%) e ${pior.cidade} precisa de mais atenção (${pior.percentual}%).`,
  };
}
