import { formatDateTime } from "@/domain/crm/format";
import type { PortalTimelineEntry, PortalTimelineEventKind } from "@/types/clientPortal";

const KIND_ICON: Record<PortalTimelineEventKind, string> = {
  projeto_criado: "🗂️",
  etapa_iniciada: "▶️",
  etapa_concluida: "✅",
  tarefa_concluida: "☑️",
  arquivo_enviado: "📎",
  projeto_finalizado: "🏁",
  mensagem_cliente: "💬",
  mensagem_equipe: "💬",
};

/** Reused both by the dashboard's "Últimas movimentações" (aggregated across
 * every project) and a single project's own "Linha do tempo" tab. */
export function PortalTimelineList({
  entries,
  showProjectName = false,
}: {
  entries: PortalTimelineEntry[];
  showProjectName?: boolean;
}) {
  if (entries.length === 0) {
    return <p className="crm-card-sub">Nenhum evento registrado ainda.</p>;
  }

  return (
    <div>
      {entries.map((entry) => (
        <div key={entry.id} className="crm-pj-task-row">
          <span aria-hidden="true" style={{ fontSize: 16 }}>
            {KIND_ICON[entry.kind]}
          </span>
          <div style={{ flex: 1 }}>
            <div
              style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}
            >
              <strong>{entry.title}</strong>
              <span className="crm-card-sub" style={{ margin: 0 }}>
                {formatDateTime(entry.occurredAt)}
              </span>
            </div>
            {showProjectName && <div className="crm-card-sub">{entry.projectName}</div>}
            {entry.subtitle && <div className="crm-card-sub">{entry.subtitle}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
