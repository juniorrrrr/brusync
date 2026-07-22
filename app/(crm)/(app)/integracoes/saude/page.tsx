import type { Metadata } from "next";
import { getIntegrationHealthData } from "@/application/integrations/integrationHealthQueries";
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

export const metadata: Metadata = {
  title: "Saúde das Integrações — Brusync OS",
  robots: { index: false, follow: false },
};

function formatDuration(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

export default async function IntegracoesSaudePage() {
  const health = await getIntegrationHealthData();

  return (
    <div>
      <div className="crm-kpi-grid">
        <KpiCard
          label="Integrações ativas"
          value={String(health.activeIntegrations)}
          icon={IconCheckCircle}
        />
        <KpiCard
          label="Integrações offline"
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
        <KpiCard label="Eventos enviados" value={String(health.eventsSent)} icon={IconTarget} />
        <KpiCard
          label="Eventos processados"
          value={String(health.eventsProcessed)}
          icon={IconReport}
        />
        <KpiCard
          label="Tempo médio de execução"
          value={formatDuration(health.averageDurationMs)}
          icon={IconClock}
        />
        <KpiCard
          label="Taxa de sucesso"
          value={health.successRate !== null ? `${health.successRate.toFixed(1)}%` : "—"}
          icon={IconCheckCircle}
        />
      </div>

      <div className="crm-card crm-card-pad" style={{ marginTop: 16 }}>
        <div className="crm-card-title">Sobre estes números</div>
        <p className="crm-ig-desc" style={{ marginTop: 6 }}>
          "Eventos enviados" e "eventos processados" contam as linhas do Event Bus
          (integration_events publicadas pelo CRM). Nesta fase nenhum destino real consome esses
          eventos, então "processados" tende a ficar em 0 até o primeiro dispatcher real existir —
          isso é esperado, não um erro.
        </p>
      </div>
    </div>
  );
}
