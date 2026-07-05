import { obterDashboard } from "@/modules/dashboard/dashboard.service";
import { metaInteligenteHistorica } from "@/modules/intelligence/decision-engine-v2";
import { registrarAuditoria } from "@/modules/audit/audit.service";
import { ErroAplicacao } from "@/middlewares/error.middleware";
import { InfoCliente } from "@/lib/requestInfo";
import { SimularCenarioInput } from "./simulations.validation";

const FATOR_GANHO_POR_TIME = 0.18; // cada time extra melhora o ritmo em ~18%

/**
 * SIMULAÇÕES (Sprint 06)
 * -----------------------
 * Cenários "e se" — nunca escrevem em `Importacao`, `Snapshot` ou
 * `IndicadorDiario`. Usam o estado atual do Dashboard como ponto de
 * partida e aplicam um modelo simples de ganho de ritmo por reforço de
 * equipe. A execução é registrada em Auditoria (é uma decisão de negócio
 * relevante, mesmo não alterando dados operacionais).
 */
export async function simularCenario(
  empresaId: string,
  usuarioId: string,
  input: SimularCenarioInput,
  cliente: InfoCliente
) {
  const dashboard = await obterDashboard(empresaId);
  if (!dashboard.possuiDados) {
    throw new ErroAplicacao("Sem dados suficientes para simular. Importe as rotinas 901 e 8072 primeiro.", 400);
  }

  const cidade = dashboard.radarOperacional.find((c) => c.cidade === input.cidade);
  if (!cidade) {
    throw new ErroAplicacao(`Cidade "${input.cidade}" não encontrada na operação atual.`, 404);
  }

  const ganhoRitmo = 1 + input.reforcoEquipe * FATOR_GANHO_POR_TIME;
  const percentualSimulado = Math.min(100, Math.round(cidade.percentual * ganhoRitmo));
  const cargasRestantesAtual = cidade.cargas - cidade.concluidas;
  const cargasRestantesSimulado = Math.max(0, Math.round(cargasRestantesAtual / ganhoRitmo));

  const metaAtual = await metaInteligenteHistorica(empresaId);
  const metaSimulada = Math.max(0, Math.min(100, metaAtual + input.ajusteMetaPp));

  const resultado = {
    cidade: cidade.cidade,
    cenario: { reforcoEquipe: input.reforcoEquipe, ajusteMetaPp: input.ajusteMetaPp },
    atual: {
      percentual: cidade.percentual,
      cargasRestantes: cargasRestantesAtual,
      metaInteligente: metaAtual,
    },
    simulado: {
      percentual: percentualSimulado,
      cargasRestantes: cargasRestantesSimulado,
      metaInteligente: metaSimulada,
    },
    melhora: percentualSimulado - cidade.percentual,
  };

  await registrarAuditoria({
    empresaId,
    usuarioId,
    acao: "SIMULACAO_EXECUTADA",
    detalhes: { cidade: cidade.cidade, cenario: resultado.cenario, melhora: resultado.melhora },
    ip: cliente.ip,
    userAgent: cliente.userAgent,
  });

  return resultado;
}
