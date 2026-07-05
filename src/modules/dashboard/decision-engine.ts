/**
 * MOTOR DE DECISÃO — VERSÃO HEURÍSTICA (Sprint 03)
 * -------------------------------------------------
 * O prompt mestre define o "Motor de Decisão" completo (Meta Inteligente,
 * Previsão, Confiabilidade, Saúde Operacional, Risco Operacional) como
 * escopo do Sprint 04 (Inteligência Operacional), com histórico de 30 dias,
 * DNA Operacional e insights de IA.
 *
 * Para não bloquear o Dashboard/Prévia do Sprint 03, este arquivo isola
 * versões simples e claramente documentadas desses cálculos. A interface
 * (assinatura das funções) foi desenhada para ser substituída no Sprint 04
 * sem exigir mudanças nas rotas ou no frontend.
 */

const INICIO_EXPEDIENTE_HORA = 7; // 07:00
const FIM_EXPEDIENTE_HORA = 20; // 20:00
const TOLERANCIA_ATRASO_PP = 15; // pontos percentuais de tolerância antes de marcar "atraso"

/** Percentual esperado de conclusão para o horário atual, em uma reta simples entre início e fim do expediente. */
export function metaEsperadaParaAgora(agora: Date = new Date()): number {
  const hora = agora.getHours() + agora.getMinutes() / 60;
  if (hora <= INICIO_EXPEDIENTE_HORA) return 0;
  if (hora >= FIM_EXPEDIENTE_HORA) return 100;
  const progresso = (hora - INICIO_EXPEDIENTE_HORA) / (FIM_EXPEDIENTE_HORA - INICIO_EXPEDIENTE_HORA);
  return Math.round(progresso * 100);
}

export function estaAtrasado(percentualAtual: number, metaEsperada: number): boolean {
  return percentualAtual < metaEsperada - TOLERANCIA_ATRASO_PP;
}

export function saudeOperacional(percentualGeral: number): { label: "Saudável" | "Atenção" | "Crítico"; cor: string } {
  if (percentualGeral >= 85) return { label: "Saudável", cor: "#2BC4B0" };
  if (percentualGeral >= 60) return { label: "Atenção", cor: "#F2A93B" };
  return { label: "Crítico", cor: "#F0483E" };
}

/**
 * Previsão de encerramento: extrapola o ritmo médio de conclusão das
 * últimas horas para estimar quando as cargas restantes terminarão.
 * Sprint 04 deve substituir por um modelo baseado em histórico real
 * (séries temporais dos Snapshots).
 */
export function preverEncerramento(percentualAtual: number, agora: Date = new Date()): string {
  const hora = agora.getHours() + agora.getMinutes() / 60;
  const horasDecorridas = Math.max(hora - INICIO_EXPEDIENTE_HORA, 0.5);
  const ritmoPorHora = percentualAtual / horasDecorridas || 1;
  const horasRestantesEstimadas = Math.max(0, (100 - percentualAtual) / ritmoPorHora);
  const previsao = new Date(agora.getTime() + horasRestantesEstimadas * 60 * 60 * 1000);
  return previsao.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

/** Confiabilidade: quão perto a operação está da meta esperada para o horário. Placeholder simples. */
export function confiabilidade(percentualAtual: number, metaEsperada: number): number {
  if (metaEsperada === 0) return 100;
  const aderencia = Math.min(percentualAtual / metaEsperada, 1);
  return Math.round(aderencia * 100);
}

/**
 * Meta Inteligente: no Sprint 04 será calculada a partir da média histórica
 * dos últimos 30 dias (Snapshots). Por ora, retorna um valor de referência
 * fixo configurável, documentado como placeholder.
 */
export function metaInteligentePlaceholder(): number {
  return 82;
}
