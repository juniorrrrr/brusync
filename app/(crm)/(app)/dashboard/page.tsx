import type { Metadata } from "next";
import { getDashboardData } from "@/application/crm/dashboardQueries";
import { AwaitingContactPanel } from "@/components/dashboard/AwaitingContactPanel";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { OriginPanel } from "@/components/dashboard/OriginPanel";
import { PerformancePanel } from "@/components/dashboard/PerformancePanel";
import { PipelineSummaryPanel } from "@/components/dashboard/PipelineSummaryPanel";
import { RecentActivityPanel } from "@/components/dashboard/RecentActivityPanel";
import { RecentDownloadsPanel } from "@/components/dashboard/RecentDownloadsPanel";
import { UpcomingTasksPanel } from "@/components/dashboard/UpcomingTasksPanel";
import {
  IconBuilding,
  IconChart,
  IconFunnel,
  IconPackage,
  IconTarget,
  IconWallet,
} from "@/components/ui/icons";
import { formatCurrencyBRL, formatPercent } from "@/domain/crm/format";

export const metadata: Metadata = {
  title: "Dashboard — Brusync OS",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const data = await getDashboardData();
  const { kpis } = data;

  return (
    <div>
      <div className="crm-page-head">
        <div>
          <h1 className="crm-page-title">Dashboard</h1>
          <p className="crm-page-sub">Visão geral da operação Brusync</p>
        </div>
      </div>

      <div className="crm-kpi-grid">
        <KpiCard label="Leads Hoje" value={String(kpis.leadsToday)} icon={IconTarget} />
        <KpiCard label="Leads no Mês" value={String(kpis.leadsThisMonth)} icon={IconChart} />
        <KpiCard
          label="Conversão no Mês"
          value={formatPercent(kpis.conversionRate)}
          icon={IconFunnel}
        />
        <KpiCard
          label="Ticket Potencial Médio"
          value={formatCurrencyBRL(kpis.averagePotentialValue)}
          icon={IconWallet}
        />
        <KpiCard label="Clientes Ativos" value={String(kpis.activeClients)} icon={IconBuilding} />
        <KpiCard
          label="Novos Clientes no Mês"
          value={String(kpis.newClientsThisMonth)}
          icon={IconBuilding}
        />
        <KpiCard
          label="Materiais Baixados no Mês"
          value={String(kpis.downloadsThisMonth)}
          icon={IconPackage}
        />
      </div>

      <div className="crm-row">
        <PerformancePanel dailyCounts={data.dailyLeadCounts} />
        <OriginPanel originCounts={data.originCounts} />
      </div>

      <div className="crm-row">
        <PipelineSummaryPanel stageCounts={data.stageCounts} />
        <AwaitingContactPanel leads={data.awaitingContact} />
      </div>

      <div className="crm-row">
        <RecentActivityPanel activities={data.recentActivities} />
        <UpcomingTasksPanel tasks={data.upcomingTasks} />
      </div>

      <div className="crm-chart-wrap">
        <RecentDownloadsPanel downloads={data.recentDownloads} />
      </div>
    </div>
  );
}
