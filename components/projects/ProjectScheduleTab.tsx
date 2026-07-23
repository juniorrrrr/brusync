import { formatDateTime } from "@/domain/crm/format";
import { PROJECT_PHASE_STATUS_LABEL } from "@/domain/projects/types";
import type { ProjectDetail } from "@/types/projects";

/** Cronograma — a lightweight, corporate visual of each phase's date range,
 * not a generic Gantt widget. */
export function ProjectScheduleTab({ project }: { project: ProjectDetail }) {
  return (
    <div>
      {project.phases.map((phase) => (
        <div key={phase.id} className="crm-pj-schedule-item">
          <span className={`crm-pj-schedule-dot ${phase.status}`} />
          <div style={{ flex: 1 }}>
            <div
              style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}
            >
              <strong>{phase.name}</strong>
              <span className="crm-card-sub" style={{ margin: 0 }}>
                {PROJECT_PHASE_STATUS_LABEL[phase.status]} · {phase.progressPercent}%
              </span>
            </div>
            <div className="crm-card-sub" style={{ marginTop: 2 }}>
              {phase.startedAt ? formatDateTime(phase.startedAt) : "Não iniciada"}
              {phase.completedAt
                ? ` → ${formatDateTime(phase.completedAt)}`
                : phase.dueAt
                  ? ` → previsão ${formatDateTime(phase.dueAt)}`
                  : ""}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
