import { BreakdownPanel } from "@/components/conversions/BreakdownPanel";
import { BarChart, LineChart } from "@/components/dashboard-mock/primitives/charts";
import { buildSparklinePath } from "@/domain/crm/sparkline";
import type { FinancialDashboardData } from "@/types/financial";

function toBreakdownItems(items: { label: string; value: number }[]) {
  return items.map((item) => ({ label: item.label, count: Math.round(item.value) }));
}

export function FinancialDashboardCharts({ data }: { data: FinancialDashboardData }) {
  const cashFlowPath = buildSparklinePath(
    data.monthlySeries.map((point) => point.netCashFlow),
    92,
  );
  const revenueBars = data.monthlySeries.map((point) => ({
    value: point.revenue,
    color: "var(--accent)",
  }));

  return (
    <div>
      <div className="crm-fin-charts-row">
        <div className="crm-card crm-card-pad reveal in">
          <div className="crm-card-head">
            <div>
              <div className="crm-card-title">Fluxo de caixa</div>
              <div className="crm-card-sub">Recebido − pago, últimos 6 meses</div>
            </div>
          </div>
          <div className="crm-chart-wrap" style={{ marginTop: 12 }}>
            <LineChart d={cashFlowPath} color="var(--secondary)" />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            {data.monthlySeries.map((point) => (
              <span key={point.month} className="crm-card-sub" style={{ margin: 0, fontSize: 11 }}>
                {point.label}
              </span>
            ))}
          </div>
        </div>

        <div className="crm-card crm-card-pad reveal in">
          <div className="crm-card-head">
            <div>
              <div className="crm-card-title">Receitas por mês</div>
              <div className="crm-card-sub">Valores recebidos</div>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <BarChart bars={revenueBars} height={80} />
          </div>
        </div>
      </div>

      <div className="crm-fin-breakdown-grid">
        <BreakdownPanel
          title="Despesas por categoria"
          subtitle="Onde o dinheiro está saindo"
          items={toBreakdownItems(data.expenseByCategory)}
        />
        <BreakdownPanel
          title="Clientes mais rentáveis"
          subtitle="Receita recebida por cliente"
          items={toBreakdownItems(data.revenueByClient)}
        />
        <BreakdownPanel
          title="Projetos mais lucrativos"
          subtitle="Receita recebida por projeto"
          items={toBreakdownItems(data.revenueByProject)}
        />
        <BreakdownPanel
          title="Origens que mais geram faturamento"
          subtitle="Receita recebida por origem do lead"
          items={toBreakdownItems(data.revenueByOrigin)}
        />
      </div>
    </div>
  );
}
