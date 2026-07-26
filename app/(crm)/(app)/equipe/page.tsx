import type { Metadata } from "next";
import { fetchTeamDashboardData, fetchTeamNotifications } from "@/application/team/teamQueries";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { TeamMemberBreakdownTable } from "@/components/team/TeamMemberBreakdownTable";
import { TeamNotificationsPanel } from "@/components/team/TeamNotificationsPanel";
import { TeamRankingTable } from "@/components/team/TeamRankingTable";
import {
  IconChart,
  IconCheckCircle,
  IconClock,
  IconTarget,
  IconUsers,
} from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Equipe — Brusync OS",
};

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function EquipeDashboardPage() {
  const [data, notifications] = await Promise.all([
    fetchTeamDashboardData(),
    fetchTeamNotifications(),
  ]);
  const { indicators } = data;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="crm-kpi-grid">
        <KpiCard label="Colaboradores ativos" value={indicators.activeMembers} icon={IconUsers} />
        <KpiCard label="Metas atingidas" value={indicators.goalsAchieved} icon={IconCheckCircle} />
        <KpiCard label="Metas em risco" value={indicators.goalsAtRisk} icon={IconTarget} />
        <KpiCard
          label="Produtividade média"
          value={
            indicators.averageProductivity !== null
              ? `${indicators.averageProductivity.toFixed(0)}%`
              : "—"
          }
          icon={IconChart}
        />
        <KpiCard
          label="Tempo médio de resposta"
          value={
            indicators.averageResponseMinutes !== null
              ? `${indicators.averageResponseMinutes.toFixed(0)} min`
              : "—"
          }
          icon={IconClock}
        />
        <KpiCard
          label="Tempo médio até 1º contato"
          value={
            indicators.averageTimeToFirstContactDays !== null
              ? `${indicators.averageTimeToFirstContactDays.toFixed(1)} dias`
              : "—"
          }
          icon={IconClock}
        />
      </div>

      <div className="crm-int-grid">
        <TeamMemberBreakdownTable
          title="Leads por responsável"
          rows={data.leadsByMember}
          formatValue={(v) => v.toLocaleString("pt-BR")}
        />
        <TeamMemberBreakdownTable
          title="Clientes por responsável"
          rows={data.clientsByMember}
          formatValue={(v) => v.toLocaleString("pt-BR")}
        />
        <TeamMemberBreakdownTable
          title="Projetos por responsável"
          rows={data.projectsByMember}
          formatValue={(v) => v.toLocaleString("pt-BR")}
        />
        <TeamMemberBreakdownTable
          title="Receita por responsável"
          rows={data.revenueByMember}
          formatValue={formatCurrency}
        />
        <TeamMemberBreakdownTable
          title="Conversão por responsável"
          rows={data.conversionByMember}
          formatValue={(v) => `${v.toFixed(1)}%`}
        />
        <TeamNotificationsPanel notifications={notifications} />
      </div>

      <TeamRankingTable rows={data.ranking} />
    </div>
  );
}
