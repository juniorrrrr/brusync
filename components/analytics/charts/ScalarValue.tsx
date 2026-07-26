import { KpiCard } from "@/components/dashboard/KpiCard";
import { IconChart } from "@/components/ui/icons";
import { formatMetricValue } from "@/domain/analytics/metricsCatalog";
import type { AnalyticsMetricResult, AnalyticsWidgetType } from "@/types/analytics";

function changeLabel(changePercent: number | null | undefined): string | null {
  if (changePercent === null || changePercent === undefined) return null;
  const sign = changePercent >= 0 ? "+" : "";
  return `${sign}${changePercent.toFixed(1)}% vs. período anterior`;
}

export function ScalarValue({
  type,
  title,
  result,
}: {
  type: AnalyticsWidgetType;
  title: string;
  result: AnalyticsMetricResult;
}) {
  const value = result.scalar !== null ? formatMetricValue(result.scalar, result.unit) : "—";
  const hint = changeLabel(result.changePercent);

  if (type === "kpi" || type === "indicador") {
    return <KpiCard label={title} value={value} hint={hint} icon={IconChart} />;
  }

  // "cards" — mesmo valor, tratamento visual mais simples (sem ícone),
  // usado quando o widget é um dos vários cards pequenos lado a lado.
  return (
    <div className="crm-an-scalar-card">
      <span className="crm-card-sub">{title}</span>
      <strong>{value}</strong>
      {hint && <span className="crm-card-sub">{hint}</span>}
    </div>
  );
}
