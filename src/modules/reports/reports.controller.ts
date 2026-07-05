import { Response, NextFunction } from "express";
import { RequestAutenticado } from "@/middlewares/auth.middleware";
import { extrairInfoCliente } from "@/lib/requestInfo";
import { registrarAuditoria } from "@/modules/audit/audit.service";
import * as reportsService from "./reports.service";

export async function exportarExcelController(req: RequestAutenticado, res: Response, next: NextFunction) {
  try {
    const buffer = await reportsService.gerarExcel(req.usuario!.empresaId);
    const cliente = extrairInfoCliente(req);

    await registrarAuditoria({
      empresaId: req.usuario!.empresaId,
      usuarioId: req.usuario!.usuarioId,
      acao: "EXPORTACAO_REALIZADA",
      detalhes: { formato: "excel" },
      ip: cliente.ip,
      userAgent: cliente.userAgent,
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="montaview_operacao_${Date.now()}.xlsx"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
}

export async function exportarPDFController(req: RequestAutenticado, res: Response, next: NextFunction) {
  try {
    const buffer = await reportsService.gerarPDF(req.usuario!.empresaId);
    const cliente = extrairInfoCliente(req);

    await registrarAuditoria({
      empresaId: req.usuario!.empresaId,
      usuarioId: req.usuario!.usuarioId,
      acao: "EXPORTACAO_REALIZADA",
      detalhes: { formato: "pdf" },
      ip: cliente.ip,
      userAgent: cliente.userAgent,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="montaview_operacao_${Date.now()}.pdf"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
}

/**
 * Exportação em PNG não está implementada nesta versão — ver nota
 * arquitetural no README (Sprint 05). Retorna 501 explicando o motivo em
 * vez de simular um sucesso falso.
 */
export function exportarPNGController(_req: RequestAutenticado, res: Response) {
  res.status(501).json({
    erro:
      "Exportação em PNG ainda não implementada. Diferente de Excel/PDF (dados tabulares), PNG exige renderizar visualmente o Dashboard, o que normalmente requer um navegador headless (ex: Puppeteer) rodando o frontend. Ver README para a decisão arquitetural recomendada.",
  });
}
