import { KpiCard } from "@/components/dashboard/KpiCard";
import {
  IconBolt,
  IconCheckCircle,
  IconClock,
  IconReport,
  IconTarget,
  IconX,
} from "@/components/ui/icons";
import { formatDateTime } from "@/domain/crm/format";
import type { IntegrationHealthSummary } from "@/types/integrations";

function formatDuration(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

/** The 6 KPIs Fase 16 asks the Central de Integrações dashboard to show —
 * reused on both the Painel (catalog) page and the Saúde page so the same
 * numbers never drift apart between the two. */
export function IntegrationDashboardKpis({ health }: { health: IntegrationHealthSummary }) {
  return (
    <div className="crm-kpi-grid">
      <KpiCard
        label="Integrações ativas"
        value={String(health.activeIntegrations)}
        icon={IconCheckCircle}
      />
      <KpiCard
        label="Integrações inativas"
        value={String(health.offlineIntegrations)}
        icon={IconX}
      />
      <KpiCard
        label="Integrações com erro"
        value={String(health.errorIntegrations)}
        icon={IconBolt}
      />
      <KpiCard
        label="Última sincronização"
        value={health.lastSyncAt ? formatDateTime(health.lastSyncAt) : "—"}
        icon={IconClock}
      />
      <KpiCard
        label="Tempo médio de resposta"
        value={formatDuration(health.averageDurationMs)}
        icon={IconReport}
      />
      <KpiCard label="Fila de eventos" value={String(health.queuedEvents)} icon={IconTarget} />
    </div>
  );
}
