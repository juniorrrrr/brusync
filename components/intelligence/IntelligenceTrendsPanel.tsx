import { intelligenceTrendBadge } from "@/domain/intelligence/types";
import type { IntelligenceTrend } from "@/types/intelligence";

function formatValue(value: number, unit: string): string {
  if (unit === "R$") return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  if (unit === "%") return `${value.toFixed(1)}%`;
  if (unit === "x") return `${value.toFixed(2)}x`;
  return `${value.toFixed(0)} ${unit}`;
}

function arrow(direction: IntelligenceTrend["direction"]): string {
  if (direction === "subindo") return "↑";
  if (direction === "descendo") return "↓";
  return "→";
}

export function IntelligenceTrendsPanel({ trends }: { trends: IntelligenceTrend[] }) {
  return (
    <div className="crm-card crm-card-pad reveal in">
      <div className="crm-card-head">
        <div>
          <div className="crm-card-title">Tendências</div>
          <div className="crm-card-sub">Período atual comparado ao período anterior</div>
        </div>
      </div>
      <div style={{ marginTop: 6 }}>
        {trends.map((trend) => {
          const badge = intelligenceTrendBadge(trend.direction, trend.favorable);
          return (
            <div key={trend.key} className="crm-int-trend-row">
              <span style={{ fontSize: 13, color: "var(--muted)" }}>{trend.label}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>
                  {formatValue(trend.previousValue, trend.unit)}
                </span>
                <span
                  className={`crm-int-trend-value ${badge}`}
                  style={{
                    color:
                      badge === "ok" ? "#16a34a" : badge === "danger" ? "#dc2626" : "var(--ink)",
                  }}
                >
                  {arrow(trend.direction)} {formatValue(trend.currentValue, trend.unit)}
                </span>
                {trend.changePercent !== null && (
                  <span className={`crm-badge ${badge}`} style={{ fontSize: 10 }}>
                    {trend.changePercent > 0 ? "+" : ""}
                    {trend.changePercent.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
