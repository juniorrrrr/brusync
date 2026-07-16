import { LineChart } from "@/components/dashboard-mock/primitives/charts";

const PERFORMANCE_PATH =
  "M0 78 L30 66 L60 70 L90 52 L120 58 L150 38 L180 44 L210 26 L240 32 L270 14 L300 20";

export function PerformancePanel() {
  return (
    <div className="crm-card crm-card-pad reveal in">
      <div className="crm-card-head">
        <div>
          <div className="crm-card-title">Performance</div>
          <div className="crm-card-sub">Leads gerados — últimos 30 dias</div>
        </div>
        <span className="crm-badge ok">↑ 18.4%</span>
      </div>
      <div className="crm-chart-wrap">
        <LineChart d={PERFORMANCE_PATH} color="var(--secondary)" height={110} />
      </div>
    </div>
  );
}
