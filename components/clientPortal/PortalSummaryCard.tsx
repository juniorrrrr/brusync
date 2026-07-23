import { ProgressRing } from "@/components/crm/ProgressRing";
import { formatDateTime } from "@/domain/crm/format";
import { PROJECT_STATUS_BADGE, PROJECT_STATUS_LABEL } from "@/domain/projects/types";
import type { Project } from "@/types/projects";

/** "Resumo" + "Progresso" together — always visible above the tabs, not a
 * tab itself, since a client landing on a project should see status and
 * completion at a glance before choosing what to drill into. */
export function PortalSummaryCard({ project }: { project: Project }) {
  return (
    <div className="crm-ws-card">
      <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
        <ProgressRing value={project.progressPercent} size={72} />
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span className={`crm-badge ${PROJECT_STATUS_BADGE[project.status]}`}>
              {PROJECT_STATUS_LABEL[project.status]}
            </span>
          </div>
          {project.description && (
            <p className="crm-pj-desc" style={{ marginTop: 8 }}>
              {project.description}
            </p>
          )}
          <div className="crm-info-list" style={{ marginTop: 12 }}>
            <div className="crm-info-row">
              <span className="crm-info-row-label">Responsável</span>
              <span className="crm-info-row-value">{project.ownerName ?? "Equipe Brusync"}</span>
            </div>
            <div className="crm-info-row">
              <span className="crm-info-row-label">Tarefas</span>
              <span className="crm-info-row-value">
                {project.taskDoneCount}/{project.taskCount} concluídas
              </span>
            </div>
            <div className="crm-info-row">
              <span className="crm-info-row-label">Início</span>
              <span className="crm-info-row-value">
                {project.startedAt ? formatDateTime(project.startedAt) : "—"}
              </span>
            </div>
            <div className="crm-info-row">
              <span className="crm-info-row-label">Prazo</span>
              <span className="crm-info-row-value">
                {project.dueAt ? formatDateTime(project.dueAt) : "—"}
              </span>
            </div>
            <div className="crm-info-row">
              <span className="crm-info-row-label">Conclusão</span>
              <span className="crm-info-row-value">
                {project.completedAt ? formatDateTime(project.completedAt) : "—"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
