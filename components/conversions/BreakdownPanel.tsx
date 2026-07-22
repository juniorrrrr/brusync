import { DonutChart } from "@/components/dashboard-mock/primitives/charts";

const COLORS = [
  "var(--secondary)",
  "var(--accent)",
  "#12a594",
  "#b8722a",
  "#7c5cff",
  "var(--border)",
];

export function BreakdownPanel({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: { label: string; count: number }[];
}) {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  const segments = items.map((item, index) => ({
    label: item.label,
    value: item.count,
    color: COLORS[index % COLORS.length],
  }));

  return (
    <div className="crm-card crm-card-pad reveal in">
      <div className="crm-card-head">
        <div>
          <div className="crm-card-title">{title}</div>
          <div className="crm-card-sub">{subtitle}</div>
        </div>
      </div>
      {total === 0 ? (
        <p className="crm-card-sub" style={{ marginTop: 12 }}>
          Ainda não há eventos registrados.
        </p>
      ) : (
        <div className="crm-origin-wrap">
          <DonutChart segments={segments} size={104} />
          <ul className="crm-origin-list">
            {segments.map((segment) => (
              <li key={segment.label} className="crm-origin-row">
                <span className="crm-origin-dot" style={{ background: segment.color }} />
                <span className="crm-origin-label">{segment.label}</span>
                <span className="crm-origin-value">
                  {Math.round((segment.value / total) * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
