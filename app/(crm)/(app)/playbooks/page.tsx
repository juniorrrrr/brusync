import type { Metadata } from "next";
import Link from "next/link";
import { fetchPlaybookDashboardData } from "@/application/playbooks/playbooksQueries";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { PlaybookCard } from "@/components/playbooks/PlaybookCard";
import {
  IconChart,
  IconCheckCircle,
  IconClock,
  IconFolder,
  IconReport,
} from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Dashboard — Playbooks — Brusync OS",
};

function formatMinutes(minutes: number | null): string {
  return minutes === null ? "—" : `${minutes} min`;
}

export default async function PlaybooksDashboardPage() {
  const data = await fetchPlaybookDashboardData();

  return (
    <div>
      <div className="crm-kpi-grid">
        <KpiCard label="Playbooks ativos" value={data.activePlaybooks} icon={IconFolder} />
        <KpiCard label="Em revisão" value={data.reviewPlaybooks} icon={IconReport} />
        <KpiCard label="Etapas concluídas" value={data.completedSteps} icon={IconCheckCircle} />
        <KpiCard label="Etapas pendentes" value={data.pendingSteps} icon={IconClock} />
        <KpiCard
          label="Tempo médio por etapa"
          value={formatMinutes(data.averageStepMinutes)}
          icon={IconChart}
        />
      </div>

      <div className="crm-card-head" style={{ marginTop: 20 }}>
        <div className="crm-card-title">Playbooks mais utilizados</div>
        <Link href="/playbooks/lista" className="btn btn-outline">
          Ver lista
        </Link>
      </div>
      <div className="crm-int-grid" style={{ marginTop: 12 }}>
        {data.mostUsedPlaybooks.map((playbook) => (
          <PlaybookCard key={playbook.id} playbook={playbook} />
        ))}
      </div>

      <div className="crm-card-head" style={{ marginTop: 20 }}>
        <div className="crm-card-title">Atualizados recentemente</div>
      </div>
      <div className="crm-int-grid" style={{ marginTop: 12 }}>
        {data.recentPlaybooks.map((playbook) => (
          <PlaybookCard key={playbook.id} playbook={playbook} />
        ))}
      </div>
    </div>
  );
}
