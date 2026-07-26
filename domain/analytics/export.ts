import { formatMetricValue } from "@/domain/analytics/metricsCatalog";
import type { AnalyticsWidgetData } from "@/types/analytics";

/** Achata cada widget num conjunto de linhas "rótulo,valor" — nenhum
 * recálculo, só reformata o AnalyticsMetricResult já resolvido por
 * services/analytics/analyticsMetricsService.ts. Usado tanto pelo export
 * CSV quanto pelo "Excel" (truque de tabela HTML com MIME do Excel — ver
 * components/analytics/AnalyticsExportMenu.tsx), sem nenhuma dependência
 * nova no projeto. */
function widgetRows(widget: AnalyticsWidgetData): { label: string; value: string }[] {
  const { result } = widget;
  if (result.series.length > 0) {
    return result.series.map((point) => ({
      label: point.label,
      value: formatMetricValue(point.value, result.unit),
    }));
  }
  if (result.scalar !== null) {
    return [{ label: widget.widget.title, value: formatMetricValue(result.scalar, result.unit) }];
  }
  return [];
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildDashboardCsv(dashboardName: string, widgets: AnalyticsWidgetData[]): string {
  const lines = [`Dashboard,${escapeCsv(dashboardName)}`, "", "Widget,Rótulo,Valor"];
  for (const widget of widgets) {
    for (const row of widgetRows(widget)) {
      lines.push([widget.widget.title, row.label, row.value].map(escapeCsv).join(","));
    }
  }
  return lines.join("\n");
}

export function buildDashboardExcelHtml(
  dashboardName: string,
  widgets: AnalyticsWidgetData[],
): string {
  const rows = widgets
    .flatMap((widget) => widgetRows(widget).map((row) => ({ widget: widget.widget.title, ...row })))
    .map((row) => `<tr><td>${row.widget}</td><td>${row.label}</td><td>${row.value}</td></tr>`)
    .join("");

  return `<!doctype html><html><head><meta charset="utf-8"></head><body>
    <h2>${dashboardName}</h2>
    <table border="1"><thead><tr><th>Widget</th><th>Rótulo</th><th>Valor</th></tr></thead>
    <tbody>${rows}</tbody></table>
  </body></html>`;
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
