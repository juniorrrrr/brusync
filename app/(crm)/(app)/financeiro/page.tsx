import type { Metadata } from "next";
import Link from "next/link";
import { getFinancialDashboardPageData } from "@/application/financial/financialDashboardQueries";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { FinancialDashboardCharts } from "@/components/financial/FinancialDashboardCharts";
import {
  IconArrowSwap,
  IconBell,
  IconBolt,
  IconCheckCircle,
  IconClock,
  IconDoc,
  IconTarget,
  IconWallet,
} from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Financeiro — Brusync OS",
};

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function FinanceiroPage() {
  const data = await getFinancialDashboardPageData();

  return (
    <div>
      <div className="crm-card-head">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--primary)" }}>Financeiro</h1>
          <p className="crm-card-sub" style={{ marginTop: 4 }}>
            Visão financeira da operação comercial — não substitui um sistema contábil.
          </p>
        </div>
        <Link href="/financeiro/lancamentos" className="btn btn-outline">
          Ver lançamentos
        </Link>
      </div>

      <div className="crm-kpi-grid" style={{ marginTop: 20 }}>
        <KpiCard
          label="Receita prevista"
          value={formatCurrency(data.expectedRevenue)}
          icon={IconWallet}
        />
        <KpiCard
          label="Receita recebida"
          value={formatCurrency(data.receivedRevenue)}
          icon={IconCheckCircle}
        />
        <KpiCard
          label="Receita do mês"
          value={formatCurrency(data.monthRevenue)}
          icon={IconTarget}
        />
        <KpiCard
          label="Despesas do mês"
          value={formatCurrency(data.monthExpense)}
          icon={IconBolt}
        />
        <KpiCard label="Lucro bruto" value={formatCurrency(data.grossProfit)} icon={IconDoc} />
        <KpiCard
          label="Fluxo de caixa"
          value={formatCurrency(data.cashFlow)}
          icon={IconArrowSwap}
        />
        <KpiCard
          label="Contas vencidas"
          value={data.overdueCount}
          hint={formatCurrency(data.overdueAmount)}
          icon={IconBell}
        />
        <KpiCard
          label="Contas a vencer (30 dias)"
          value={data.upcomingCount}
          hint={formatCurrency(data.upcomingAmount)}
          icon={IconClock}
        />
        <KpiCard
          label="Ticket médio"
          value={formatCurrency(data.averageTicket)}
          icon={IconWallet}
        />
        <KpiCard
          label="Margem média"
          value={data.averageMargin === null ? "—" : `${data.averageMargin}%`}
          icon={IconTarget}
        />
      </div>

      <div style={{ marginTop: 20 }}>
        <FinancialDashboardCharts data={data} />
      </div>
    </div>
  );
}
