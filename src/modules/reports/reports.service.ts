import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { obterDashboard } from "@/modules/dashboard/dashboard.service";
import { ErroAplicacao } from "@/middlewares/error.middleware";

/**
 * Gera um relatório Excel (.xlsx) com o estado atual da operação:
 * uma aba de indicadores gerais e uma aba com o detalhamento por cidade.
 */
export async function gerarExcel(empresaId: string): Promise<Buffer> {
  const dashboard = await obterDashboard(empresaId);
  if (!dashboard.possuiDados) {
    throw new ErroAplicacao(dashboard.mensagem ?? "Sem dados para exportar.", 400);
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "MontaView Enterprise";
  workbook.created = new Date();

  const abaIndicadores = workbook.addWorksheet("Indicadores");
  abaIndicadores.columns = [
    { header: "Indicador", key: "indicador", width: 32 },
    { header: "Valor", key: "valor", width: 20 },
  ];
  abaIndicadores.addRows([
    { indicador: "Saúde Operacional", valor: dashboard.indicadores.saudeOperacional.label },
    { indicador: "Percentual Geral", valor: `${dashboard.indicadores.percentualGeral}%` },
    { indicador: "Meta Inteligente", valor: `${dashboard.indicadores.metaInteligente}%` },
    { indicador: "Previsão de Encerramento", valor: dashboard.indicadores.previsaoEncerramento },
    { indicador: "Confiabilidade", valor: `${dashboard.indicadores.confiabilidade}%` },
  ]);
  abaIndicadores.getRow(1).font = { bold: true };

  const abaCidades = workbook.addWorksheet("Cidades");
  abaCidades.columns = [
    { header: "Cidade", key: "cidade", width: 24 },
    { header: "Cargas", key: "cargas", width: 12 },
    { header: "Concluídas", key: "concluidas", width: 14 },
    { header: "Percentual", key: "percentual", width: 14 },
    { header: "Prioridade", key: "prioridade", width: 12 },
    { header: "Atraso", key: "atraso", width: 10 },
  ];
  abaCidades.addRows(
    dashboard.radarOperacional.map((c) => ({
      cidade: c.cidade,
      cargas: c.cargas,
      concluidas: c.concluidas,
      percentual: `${c.percentual}%`,
      prioridade: c.prioridade,
      atraso: c.atraso ? "Sim" : "Não",
    }))
  );
  abaCidades.getRow(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Gera um relatório PDF simples com os indicadores gerais e a tabela por
 * cidade — mesmo conteúdo do Excel, em formato de leitura/impressão.
 */
export async function gerarPDF(empresaId: string): Promise<Buffer> {
  const dashboard = await obterDashboard(empresaId);
  if (!dashboard.possuiDados) {
    throw new ErroAplicacao(dashboard.mensagem ?? "Sem dados para exportar.", 400);
  }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(20).text("MontaView Enterprise — Relatório da Operação", { align: "left" });
    doc.fontSize(10).fillColor("#666").text(`Gerado em ${new Date().toLocaleString("pt-BR")}`);
    doc.moveDown(1.5);

    doc.fillColor("#000").fontSize(14).text("Indicadores gerais");
    doc.moveDown(0.5);
    doc.fontSize(11);
    const linhas: [string, string][] = [
      ["Saúde Operacional", dashboard.indicadores.saudeOperacional.label],
      ["Percentual Geral", `${dashboard.indicadores.percentualGeral}%`],
      ["Meta Inteligente", `${dashboard.indicadores.metaInteligente}%`],
      ["Previsão de Encerramento", dashboard.indicadores.previsaoEncerramento],
      ["Confiabilidade", `${dashboard.indicadores.confiabilidade}%`],
    ];
    for (const [label, valor] of linhas) {
      doc.text(`${label}: ${valor}`);
    }

    doc.moveDown(1.5);
    doc.fontSize(14).text("Detalhamento por cidade");
    doc.moveDown(0.5);
    doc.fontSize(10);
    for (const c of dashboard.radarOperacional) {
      doc.text(
        `${c.cidade} — ${c.concluidas}/${c.cargas} cargas (${c.percentual}%)${c.atraso ? "  [ATRASADO]" : ""}`
      );
    }

    doc.end();
  });
}
