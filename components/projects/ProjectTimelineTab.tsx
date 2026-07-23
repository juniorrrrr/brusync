import { formatDateTime } from "@/domain/crm/format";
import { buildProjectTimeline } from "@/domain/projects/timeline";
import type { ProjectDetail, ProjectTimelineEventKind } from "@/types/projects";

const KIND_ICON: Record<ProjectTimelineEventKind, string> = {
  projeto_criado: "🗂️",
  etapa_iniciada: "▶️",
  etapa_concluida: "✅",
  tarefa_concluida: "☑️",
  arquivo_enviado: "📎",
  projeto_finalizado: "🏁",
};

export function ProjectTimelineTab({ project }: { project: ProjectDetail }) {
  const entries = buildProjectTimeline(project);

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
            {entry.subtitle && <div className="crm-card-sub">{entry.subtitle}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
