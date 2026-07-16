import { DonutChart } from "@/components/dashboard-mock/primitives/charts";

const ORIGINS = [
  { label: "Google Ads", value: 38, color: "var(--secondary)" },
  { label: "Instagram", value: 24, color: "var(--accent)" },
  { label: "Indicação", value: 18, color: "#12a594" },
  { label: "Orgânico", value: 12, color: "#b8722a" },
  { label: "Outros", value: 8, color: "var(--border)" },
];

export function OriginPanel() {
  return (
    <div className="crm-card crm-card-pad reveal in">
      <div className="crm-card-head">
        <div>
          <div className="crm-card-title">Origem dos Leads</div>
          <div className="crm-card-sub">Distribuição por canal — últimos 30 dias</div>
        </div>
      </div>
      <div className="crm-origin-wrap">
        <DonutChart segments={ORIGINS} size={104} />
        <ul className="crm-origin-list">
          {ORIGINS.map((origin) => (
            <li key={origin.label} className="crm-origin-row">
              <span className="crm-origin-dot" style={{ background: origin.color }} />
              <span className="crm-origin-label">{origin.label}</span>
              <span className="crm-origin-value">{origin.value}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
