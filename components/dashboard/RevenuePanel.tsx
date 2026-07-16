import { BarChart } from "@/components/dashboard-mock/primitives/charts";

const REVENUE_BARS = [
  { value: 32, color: "var(--border)" },
  { value: 41, color: "var(--border)" },
  { value: 38, color: "var(--border)" },
  { value: 52, color: "var(--border)" },
  { value: 47, color: "var(--border)" },
  { value: 60, color: "var(--accent)" },
];

export function RevenuePanel() {
  return (
    <div className="crm-card crm-card-pad reveal in">
      <div className="crm-card-head">
        <div>
          <div className="crm-card-title">Receita</div>
          <div className="crm-card-sub">
            Dado ilustrativo — módulo Financeiro em desenvolvimento
          </div>
        </div>
        <span className="crm-badge neutral">Placeholder</span>
      </div>
      <div className="crm-chart-wrap">
        <BarChart bars={REVENUE_BARS} height={64} />
      </div>
    </div>
  );
}
