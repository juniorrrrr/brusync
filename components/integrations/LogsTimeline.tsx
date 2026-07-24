import { formatDateTime } from "@/domain/crm/format";
import { integrationLogEventLabel } from "@/domain/integrationsCenter/logEvents";
import type { IntegrationLog } from "@/types/integrations";

const STATUS_LABEL: Record<IntegrationLog["status"], string> = {
  success: "Sucesso",
  error: "Erro",
  pending: "Pendente",
};

function formatDuration(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

export function LogsTimeline({ logs }: { logs: IntegrationLog[] }) {
  if (logs.length === 0) {
    return <p className="crm-ig-desc">Nenhum log encontrado para os filtros selecionados.</p>;
  }

  return (
    <div className="crm-card crm-card-pad">
      {logs.map((log) => (
        <div key={log.id} className="crm-tl-item">
          <span className="crm-tl-ico">
            <span className={`crm-ig-log-dot ${log.status}`} />
          </span>
          <div>
            <div className="crm-tl-title">
              {integrationLogEventLabel(log.event)}
              {log.integrationName ? ` · ${log.integrationName}` : ""}
            </div>
            <div className="crm-tl-meta">
              {STATUS_LABEL[log.status]} · {formatDateTime(log.createdAt)} ·{" "}
              {formatDuration(log.durationMs)}
              {log.origin ? ` · origem: ${log.origin}` : ""}
              {log.destination ? ` · destino: ${log.destination}` : ""}
            </div>
            {log.message && <div className="crm-tl-body">{log.message}</div>}
            {log.payload && (
              <div className="crm-tl-body" style={{ opacity: 0.7 }}>
                {JSON.stringify(log.payload).slice(0, 160)}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
