import type { Metadata } from "next";
import { getAgendaHealthData } from "@/application/agenda/agendaHealthQueries";
import { getAgendaPageData, getPipelineStageOptions } from "@/application/agenda/agendaQueries";
import { fetchOwnerOptions } from "@/application/crm/leadsActions";
import { AgendaBoard } from "@/components/agenda/AgendaBoard";
import { AgendaFilterBar } from "@/components/agenda/AgendaFilterBar";
import { AgendaQuickPanel } from "@/components/agenda/AgendaQuickPanel";
import { RemindersPanel } from "@/components/agenda/RemindersPanel";
import { KpiCard } from "@/components/dashboard/KpiCard";
import {
  IconBell,
  IconCheckCircle,
  IconClock,
  IconMessage,
  IconTarget,
  IconUsers,
} from "@/components/ui/icons";
import { resolveRangeQuery } from "@/domain/agenda/dateRanges";
import { AGENDA_RANGE_LABEL } from "@/domain/agenda/types";
import type { AgendaEventType, AgendaRangeFilter } from "@/types/agenda";

export const metadata: Metadata = {
  title: "Agenda Comercial — Brusync OS",
  robots: { index: false, follow: false },
};

function formatDuration(ms: number | null): string {
  if (ms === null) return "—";
  const hours = ms / (1000 * 60 * 60);
  if (hours < 1) return `${Math.round(ms / (1000 * 60))} min`;
  if (hours < 24) return `${hours.toFixed(1)} h`;
  return `${(hours / 24).toFixed(1)} dias`;
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const range = (params.range as AgendaRangeFilter | undefined) ?? "hoje";
  const rangeQuery = resolveRangeQuery(range);

  const [health, page, meetingsPanel, followUpsPanel, callsPanel, owners, pipelineStages] =
    await Promise.all([
      getAgendaHealthData(),
      getAgendaPageData({
        ...rangeQuery,
        ownerId: params.ownerId || undefined,
        stageKey: params.stageKey || undefined,
        eventType: (params.eventType as AgendaEventType | undefined) || undefined,
        search: params.q || undefined,
        limit: 100,
      }),
      getAgendaPageData({
        scheduledFrom: new Date().toISOString(),
        status: "agendado",
        eventType: "reuniao",
        limit: 4,
      }),
      getAgendaPageData({ status: "agendado", eventType: "follow_up", limit: 4 }),
      getAgendaPageData({
        scheduledFrom: new Date().toISOString(),
        status: "agendado",
        eventType: "ligacao",
        limit: 4,
      }),
      fetchOwnerOptions(),
      getPipelineStageOptions(),
    ]);

  return (
    <div>
      <div className="crm-kpi-grid">
        <KpiCard label="Atividades hoje" value={String(health.activitiesToday)} icon={IconClock} />
        <KpiCard label="Atrasadas" value={String(health.overdue)} icon={IconBell} />
        <KpiCard label="Reuniões do dia" value={String(health.meetingsToday)} icon={IconUsers} />
        <KpiCard
          label="Follow-ups pendentes"
          value={String(health.pendingFollowUps)}
          icon={IconMessage}
        />
        <KpiCard
          label="Taxa de conclusão"
          value={health.completionRate !== null ? `${health.completionRate.toFixed(1)}%` : "—"}
          icon={IconTarget}
        />
        <KpiCard
          label="Tempo médio até conclusão"
          value={formatDuration(health.averageTimeToCompleteMs)}
          icon={IconCheckCircle}
        />
      </div>

      <div className="crm-ag-quick-grid" style={{ marginTop: 16 }}>
        <AgendaQuickPanel
          title="Reuniões"
          events={meetingsPanel.events}
          emptyText="Nenhuma reunião agendada."
        />
        <AgendaQuickPanel
          title="Follow-ups"
          events={followUpsPanel.events}
          emptyText="Nenhum follow-up pendente."
        />
        <AgendaQuickPanel
          title="Ligações agendadas"
          events={callsPanel.events}
          emptyText="Nenhuma ligação agendada."
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <AgendaFilterBar owners={owners} pipelineStages={pipelineStages} />
      </div>

      <div className="crm-row" style={{ marginTop: 16, alignItems: "flex-start" }}>
        <div style={{ flex: 2 }}>
          <AgendaBoard
            events={page.events}
            owners={owners}
            emptyText={`Nenhum evento em "${AGENDA_RANGE_LABEL[range]}" para os filtros selecionados.`}
          />
        </div>
        <div style={{ flex: 1 }}>
          <RemindersPanel />
        </div>
      </div>
    </div>
  );
}
