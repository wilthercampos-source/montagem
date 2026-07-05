import { Response, NextFunction } from "express";
import { RequestAutenticado } from "@/middlewares/auth.middleware";
import { obterDashboard } from "@/modules/dashboard/dashboard.service";

/**
 * Painel TV não é uma fonte de dados própria — é uma projeção enxuta do
 * Dashboard (Sprint 03), removendo campos irrelevantes para uma tela sem
 * interação (auditoria, comparativos detalhados, resumo textual longo).
 * Isso evita duplicar lógica de agregação: qualquer melhoria no Dashboard
 * já reflete aqui automaticamente.
 */
export async function painelTVController(req: RequestAutenticado, res: Response, next: NextFunction) {
  try {
    const dashboard = await obterDashboard(req.usuario!.empresaId);

    if (!dashboard.possuiDados) {
      return res.json({ possuiDados: false, mensagem: dashboard.mensagem });
    }

    res.json({
      possuiDados: true,
      percentualGeral: dashboard.indicadores.percentualGeral,
      saudeOperacional: dashboard.indicadores.saudeOperacional,
      previsaoEncerramento: dashboard.indicadores.previsaoEncerramento,
      confiabilidade: dashboard.indicadores.confiabilidade,
      cidadesAtrasadas: dashboard.alertas.length,
      radarOperacional: dashboard.radarOperacional,
      atualizadoEm: new Date(),
    });
  } catch (err) {
    next(err);
  }
}
