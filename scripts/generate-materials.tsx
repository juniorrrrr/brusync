import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { renderToFile } from "@react-pdf/renderer";
import ExcelJS from "exceljs";
import { escolherSoftwareChecklist } from "../pdf/content/escolher-software-checklist";
import { iaEbook } from "../pdf/content/ia-ebook";
import { integracaoGuia } from "../pdf/content/integracao-guia";
import { transformacaoChecklist } from "../pdf/content/transformacao-checklist";
import { whitelabelEbook } from "../pdf/content/whitelabel-ebook";
import { PdfDocument } from "../pdf/PdfDocument";
import type { PdfDocumentData } from "../pdf/types";

const OUT_DIR = path.resolve(__dirname, "../public/materiais");

const BRAND = {
  primary: "FF081C3A",
  accent: "FF25D0C3",
  secondary: "FF1F5EFF",
  surface: "FFF7FAFC",
  border: "FFE7EDF5",
  white: "FFFFFFFF",
};

const PDF_DOCS: PdfDocumentData[] = [
  whitelabelEbook,
  iaEbook,
  transformacaoChecklist,
  integracaoGuia,
  escolherSoftwareChecklist,
];

function headerRowStyle(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: BRAND.white }, size: 11 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND.primary } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  });
  row.height = 26;
}

function sectionTitleStyle(cell: ExcelJS.Cell, text: string) {
  cell.value = text;
  cell.font = { bold: true, size: 13, color: { argb: BRAND.primary } };
}

async function generateKpiTemplate() {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Brusync";
  wb.created = new Date();

  const sheet = wb.addWorksheet("Painel de KPIs", { views: [{ state: "frozen", ySplit: 2 }] });

  sheet.mergeCells("A1:Q1");
  sectionTitleStyle(sheet.getCell("A1"), "Template de KPIs para CEOs — Brusync");
  sheet.getRow(1).height = 24;

  const headers = [
    "Mês",
    "Receita (R$)",
    "Custos (R$)",
    "Lucro (R$)",
    "Margem (%)",
    "Leads",
    "Vendas",
    "Conversão (%)",
    "Investimento Ads (R$)",
    "Novos Clientes",
    "CAC (R$)",
    "Ticket Médio (R$)",
    "Meses de Retenção",
    "LTV (R$)",
    "ROAS",
    "ROI (%)",
  ];
  sheet.addRow(headers);
  headerRowStyle(sheet.getRow(2));

  const months = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  months.forEach((month, i) => {
    const r = i + 3;
    const receita = 180000 + i * 9500;
    const custos = 128000 + i * 5200;
    const leads = 420 + i * 18;
    const vendas = 96 + i * 4;
    const investimentoAds = 32000 + i * 1400;
    const novosClientes = 34 + i * 2;
    const ticketMedio = 2100 + i * 30;
    const mesesRetencao = 14;

    sheet.addRow([
      month,
      receita,
      custos,
      { formula: `B${r}-C${r}` },
      { formula: `D${r}/B${r}` },
      leads,
      vendas,
      { formula: `G${r}/F${r}` },
      investimentoAds,
      novosClientes,
      { formula: `I${r}/J${r}` },
      ticketMedio,
      mesesRetencao,
      { formula: `L${r}*M${r}` },
      { formula: `B${r}/I${r}` },
      { formula: `D${r}/I${r}` },
    ]);
  });

  const totalRow = sheet.addRow([
    "Total / Média",
    { formula: "SUM(B3:B14)" },
    { formula: "SUM(C3:C14)" },
    { formula: "SUM(D3:D14)" },
    { formula: "AVERAGE(E3:E14)" },
    { formula: "SUM(F3:F14)" },
    { formula: "SUM(G3:G14)" },
    { formula: "AVERAGE(H3:H14)" },
    { formula: "SUM(I3:I14)" },
    { formula: "SUM(J3:J14)" },
    { formula: "AVERAGE(K3:K14)" },
    { formula: "AVERAGE(L3:L14)" },
    { formula: "AVERAGE(M3:M14)" },
    { formula: "AVERAGE(N3:N14)" },
    { formula: "AVERAGE(O3:O14)" },
    { formula: "AVERAGE(P3:P14)" },
  ]);
  totalRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: BRAND.primary } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND.surface } };
    cell.border = { top: { style: "thin", color: { argb: BRAND.border } } };
  });

  const currencyCols = ["B", "C", "D", "I", "L", "N"];
  const percentCols = ["E", "H", "P"];
  for (let r = 3; r <= 15; r++) {
    for (const col of currencyCols) sheet.getCell(`${col}${r}`).numFmt = '"R$" #,##0';
    for (const col of percentCols) sheet.getCell(`${col}${r}`).numFmt = "0.0%";
    sheet.getCell(`K${r}`).numFmt = '"R$" #,##0';
    sheet.getCell(`O${r}`).numFmt = "0.00\\x";
  }

  sheet.columns.forEach((col, idx) => {
    col.width = idx === 0 ? 16 : 15;
  });
  sheet.getColumn(1).width = 16;

  const notes = wb.addWorksheet("Como usar");
  sectionTitleStyle(notes.getCell("A1"), "Como usar este template");
  notes.getCell("A1").font = { bold: true, size: 14, color: { argb: BRAND.primary } };
  const noteLines = [
    "",
    "Este template calcula automaticamente os principais indicadores financeiros e comerciais de uma operação, mês a mês.",
    "",
    "Basta preencher as colunas de entrada (Receita, Custos, Leads, Vendas, Investimento em Ads, Novos Clientes, Ticket Médio e Meses de Retenção) — as demais colunas são calculadas por fórmula.",
    "",
    "Indicadores calculados automaticamente:",
    "• Lucro = Receita - Custos",
    "• Margem = Lucro / Receita",
    "• Conversão = Vendas / Leads",
    "• CAC (Custo de Aquisição de Cliente) = Investimento em Ads / Novos Clientes",
    "• LTV (Lifetime Value) = Ticket Médio x Meses de Retenção",
    "• ROAS (Retorno sobre Investimento em Ads) = Receita / Investimento em Ads",
    "• ROI = Lucro / Investimento em Ads",
    "",
    "Desenvolvido por Brusync — brusync.com.br",
  ];
  noteLines.forEach((line, i) => {
    notes.getCell(`A${i + 2}`).value = line;
    notes.getCell(`A${i + 2}`).font = { size: 11, color: { argb: "FF33415C" } };
  });
  notes.getColumn(1).width = 90;

  await wb.xlsx.writeFile(path.join(OUT_DIR, "template-kpis-para-ceos.xlsx"));
}

async function generatePlanejamentoTemplate() {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Brusync";
  wb.created = new Date();

  const missao = wb.addWorksheet("Missão, Visão e Valores");
  sectionTitleStyle(missao.getCell("A1"), "Missão, Visão e Valores");
  ["Missão", "Visão", "Valores"].forEach((label, i) => {
    const r = 3 + i * 3;
    missao.getCell(`A${r}`).value = label;
    missao.getCell(`A${r}`).font = { bold: true, size: 12, color: { argb: BRAND.secondary } };
    missao.mergeCells(`A${r + 1}:E${r + 1}`);
    missao.getCell(`A${r + 1}`).value = "Descreva aqui...";
    missao.getCell(`A${r + 1}`).font = { italic: true, color: { argb: "FF9AA7BD" } };
  });
  missao.getColumn(1).width = 90;

  const swot = wb.addWorksheet("Análise SWOT");
  sectionTitleStyle(swot.getCell("A1"), "Análise SWOT");
  const quadrants: { cell: string; title: string; color: string }[] = [
    { cell: "A3", title: "Forças", color: "FF12A594" },
    { cell: "D3", title: "Fraquezas", color: "FFE5484D" },
    { cell: "A12", title: "Oportunidades", color: "FF1F5EFF" },
    { cell: "D12", title: "Ameaças", color: "FFE9A23B" },
  ];
  for (const q of quadrants) {
    swot.getCell(q.cell).value = q.title;
    swot.getCell(q.cell).font = { bold: true, size: 12, color: { argb: BRAND.white } };
    swot.getCell(q.cell).fill = { type: "pattern", pattern: "solid", fgColor: { argb: q.color } };
  }
  for (const col of ["A", "B", "C", "D", "E", "F"]) {
    swot.getColumn(col).width = 20;
  }

  const okrs = wb.addWorksheet("OKRs");
  okrs.addRow(["Objetivo", "Key Result", "Meta", "Atual", "Progresso (%)", "Responsável", "Prazo"]);
  headerRowStyle(okrs.getRow(1));
  const okrRows = [
    [
      "Crescer a receita recorrente",
      "Aumentar faturamento mensal",
      250000,
      180000,
      "Diretoria Comercial",
      "Dez/2026",
    ],
    [
      "Melhorar retenção de clientes",
      "Reduzir cancelamentos mensais",
      5,
      8,
      "Sucesso do Cliente",
      "Dez/2026",
    ],
    [
      "Aumentar eficiência operacional",
      "Reduzir tempo médio de atendimento (min)",
      8,
      14,
      "Operações",
      "Nov/2026",
    ],
  ];
  okrRows.forEach((row, i) => {
    const r = i + 2;
    okrs.addRow([row[0], row[1], row[2], row[3], { formula: `D${r}/C${r}` }, row[4], row[5]]);
    okrs.getCell(`E${r}`).numFmt = "0.0%";
  });
  okrs.columns.forEach((col, idx) => {
    col.width = idx === 0 || idx === 1 ? 34 : 16;
  });

  const plano = wb.addWorksheet("Plano de Ação");
  plano.addRow(["Ação", "Responsável", "Prazo", "Prioridade", "Status"]);
  headerRowStyle(plano.getRow(1));
  const planoRows = [
    [
      "Mapear processos críticos para digitalização",
      "Operações",
      "Ago/2026",
      "Alta",
      "Em andamento",
    ],
    [
      "Definir indicadores executivos prioritários",
      "Diretoria",
      "Ago/2026",
      "Alta",
      "Não iniciado",
    ],
    ["Avaliar fornecedores de sistema próprio", "TI", "Set/2026", "Média", "Não iniciado"],
    [
      "Revisar política de segurança de dados (LGPD)",
      "Jurídico",
      "Set/2026",
      "Alta",
      "Não iniciado",
    ],
  ];
  for (const row of planoRows) plano.addRow(row);
  plano.columns.forEach((col, idx) => {
    col.width = idx === 0 ? 46 : 18;
  });

  await wb.xlsx.writeFile(path.join(OUT_DIR, "template-planejamento-estrategico.xlsx"));
}

async function main() {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  for (const doc of PDF_DOCS) {
    const outPath = path.join(OUT_DIR, `${doc.slug}.pdf`);
    await renderToFile(<PdfDocument data={doc} />, outPath);
    console.log(`✓ PDF gerado: ${doc.slug}.pdf (${doc.blocks.length} páginas)`);
  }

  await generateKpiTemplate();
  console.log("✓ XLSX gerado: template-kpis-para-ceos.xlsx");

  await generatePlanejamentoTemplate();
  console.log("✓ XLSX gerado: template-planejamento-estrategico.xlsx");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
