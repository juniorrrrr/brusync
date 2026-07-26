import { formatMetricValue } from "@/domain/analytics/metricsCatalog";
import type { AnalyticsMetricUnit, AnalyticsSeriesPoint } from "@/types/analytics";

/** Heatmap simplificado — como os resolvers de
 * services/analytics/analyticsMetricsService.ts devolvem uma série
 * label→valor (não uma matriz de duas dimensões, que nenhuma fonte hoje
 * expõe pronta sem inventar um cruzamento novo), a intensidade de cor aqui
 * representa a magnitude de cada rótulo — uma "linha" de heatmap, não uma
 * grade completa. */
export function HeatmapGrid({
  points,
  unit,
}: {
  points: AnalyticsSeriesPoint[];
  unit: AnalyticsMetricUnit;
}) {
  if (points.length === 0) return <p className="crm-card-sub">Sem dados para exibir.</p>;
  const max = Math.max(...points.map((p) => p.value), 1);

  return (
    <div className="crm-an-heatmap">
      {points.map((point) => {
        const intensity = Math.min(point.value / max, 1);
        return (
          <div
            key={point.label}
            className="crm-an-heatmap-cell"
            style={{ background: `rgba(37, 208, 195, ${0.15 + intensity * 0.7})` }}
            title={`${point.label}: ${formatMetricValue(point.value, unit)}`}
          >
            <span>{point.label}</span>
            <strong>{formatMetricValue(point.value, unit)}</strong>
          </div>
        );
      })}
    </div>
  );
}
