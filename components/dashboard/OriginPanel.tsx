import { DonutChart } from "@/components/dashboard-mock/primitives/charts";
import type { OriginCount } from "@/repositories/crm/dashboardRepository";

const COLORS = [
  "var(--secondary)",
  "var(--accent)",
  "#12a594",
  "#b8722a",
  "#7c5cff",
  "var(--border)",
];

export function OriginPanel({ originCounts }: { originCounts: OriginCount[] }) {
  const total = originCounts.reduce((sum, o) => sum + o.count, 0);
  const segments = originCounts.map((origin, index) => ({
    label: origin.label,
    value: origin.count,
    color: COLORS[index % COLORS.length],
  }));

  return (
    <div className="crm-card crm-card-pad reveal in">
      <div className="crm-card-head">
        <div>
          <div className="crm-card-title">Origem dos Leads</div>
          <div className="crm-card-sub">Distribuição por canal</div>
        </div>
      </div>
      {total === 0 ? (
        <p className="crm-card-sub" style={{ marginTop: 12 }}>
          Ainda não há leads registrados.
        </p>
      ) : (
        <div className="crm-origin-wrap">
          <DonutChart segments={segments} size={104} />
          <ul className="crm-origin-list">
            {segments.map((origin) => (
              <li key={origin.label} className="crm-origin-row">
                <span className="crm-origin-dot" style={{ background: origin.color }} />
                <span className="crm-origin-label">{origin.label}</span>
                <span className="crm-origin-value">
                  {Math.round((origin.value / total) * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
