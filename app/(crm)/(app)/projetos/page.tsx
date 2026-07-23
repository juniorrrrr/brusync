import type { Metadata } from "next";
import { fetchOwnerOptions } from "@/application/crm/leadsActions";
import { getProjectsHealthData } from "@/application/projects/projectsHealthQueries";
import {
  getClientFilterOptions,
  getProjectsPageData,
} from "@/application/projects/projectsQueries";
import { BreakdownPanel } from "@/components/conversions/BreakdownPanel";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { ProjectsBoard } from "@/components/projects/ProjectsBoard";
import { ProjectsFilterBar } from "@/components/projects/ProjectsFilterBar";
import { IconBell, IconCheckCircle, IconClock, IconTarget } from "@/components/ui/icons";
import { PROJECT_STATUS_LABEL } from "@/domain/projects/types";
import type { ProjectStatus } from "@/types/projects";

export const metadata: Metadata = {
  title: "Projetos — Brusync OS",
  robots: { index: false, follow: false },
};

export default async function ProjetosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;

  const [health, page, owners, clients] = await Promise.all([
    getProjectsHealthData(),
    getProjectsPageData({
      search: params.q || undefined,
      ownerId: params.ownerId || undefined,
      status: (params.status as ProjectStatus | undefined) || undefined,
      clientId: params.clientId || undefined,
      createdFrom: params.createdFrom || undefined,
      createdTo: params.createdTo || undefined,
      dueFrom: params.dueFrom || undefined,
      dueTo: params.dueTo || undefined,
      limit: 100,
    }),
    fetchOwnerOptions(),
    getClientFilterOptions(),
  ]);

  return (
    <div>
      <div className="crm-kpi-grid">
        <KpiCard label="Projetos ativos" value={String(health.activeProjects)} icon={IconClock} />
        <KpiCard
          label="Projetos concluídos"
          value={String(health.completedProjects)}
          icon={IconCheckCircle}
        />
        <KpiCard
          label="Projetos atrasados"
          value={String(health.overdueProjects)}
          icon={IconBell}
        />
        <KpiCard
          label="Tempo médio de implantação"
          value={health.averageDeliveryDays !== null ? `${health.averageDeliveryDays} dias` : "—"}
          icon={IconTarget}
        />
      </div>

      <div className="crm-row" style={{ marginTop: 16 }}>
        <BreakdownPanel
          title="Projetos por responsável"
          subtitle="Distribuição da carga de implantação"
          items={health.byOwner.map((row) => ({
            label: row.ownerName ?? "Sem responsável",
            count: row.count,
          }))}
        />
        <BreakdownPanel
          title="Projetos por status"
          subtitle="Onde cada projeto está no ciclo de implantação"
          items={health.byStatus.map((row) => ({
            label: PROJECT_STATUS_LABEL[row.status],
            count: row.count,
          }))}
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <ProjectsFilterBar owners={owners} clients={clients} />
      </div>

      <div style={{ marginTop: 16 }}>
        <ProjectsBoard
          projects={page.projects}
          emptyText="Nenhum projeto encontrado para os filtros selecionados."
        />
      </div>
    </div>
  );
}
