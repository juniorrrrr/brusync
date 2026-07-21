import { LineChart } from "@/components/dashboard-mock/primitives/charts";
import { buildSparklinePath } from "@/domain/crm/sparkline";

export function PerformancePanel({
  dailyCounts,
}: {
  dailyCounts: { date: string; count: number }[];
}) {
  const values = dailyCounts.map((d) => d.count);
  const path = buildSparklinePath(values, 110);
  const total = values.reduce((sum, v) => sum + v, 0);

  const half = Math.floor(values.length / 2);
  const firstHalf = values.slice(0, half).reduce((sum, v) => sum + v, 0);
  const secondHalf = values.slice(half).reduce((sum, v) => sum + v, 0);
  const trend = firstHalf > 0 ? Math.round(((secondHalf - firstHalf) / firstHalf) * 100) : null;

  return (
    <div className="crm-card crm-card-pad reveal in">
      <div className="crm-card-head">
        <div>
          <div className="crm-card-title">Performance</div>
          <div className="crm-card-sub">
            {total} lead{total === 1 ? "" : "s"} nos últimos {dailyCounts.length} dias
          </div>
        </div>
        {trend !== null && (
          <span className={`crm-badge ${trend >= 0 ? "ok" : "danger"}`}>
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="crm-chart-wrap">
        <LineChart d={path} color="var(--secondary)" height={110} />
      </div>
    </div>
  );
}
