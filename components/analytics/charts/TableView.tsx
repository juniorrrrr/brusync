import { formatMetricValue } from "@/domain/analytics/metricsCatalog";
import type { AnalyticsMetricUnit, AnalyticsSeriesPoint } from "@/types/analytics";

export function TableView({
  points,
  unit,
}: {
  points: AnalyticsSeriesPoint[];
  unit: AnalyticsMetricUnit;
}) {
  if (points.length === 0) return <p className="crm-card-sub">Sem dados para exibir.</p>;

  return (
    <table className="crm-an-table">
      <thead>
        <tr>
          <th>Rótulo</th>
          <th>Valor</th>
        </tr>
      </thead>
      <tbody>
        {points.map((point) => (
          <tr key={point.label}>
            <td>{point.label}</td>
            <td>{formatMetricValue(point.value, unit)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
