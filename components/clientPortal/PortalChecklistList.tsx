import { formatDateTime } from "@/domain/crm/format";
import {
  PROJECT_TASK_PRIORITY_BADGE,
  PROJECT_TASK_PRIORITY_LABEL,
  PROJECT_TASK_STATUS_BADGE,
  PROJECT_TASK_STATUS_LABEL,
} from "@/domain/projects/types";
import type { PortalProjectDetail } from "@/types/clientPortal";

/** Read-only — "Visualiza tarefas", not manage them. No checkbox, no
 * "Abrir" edit action; unlike ProjectChecklistTab (the internal, editable
 * equivalent), a client can look but not touch. */
export function PortalChecklistList({ project }: { project: PortalProjectDetail }) {
  const allTasks = project.phases.flatMap((phase) =>
    phase.tasks.map((task) => ({ task, phaseName: phase.name })),
  );

  if (allTasks.length === 0) {
    return <p className="crm-card-sub">Nenhuma tarefa registrada ainda.</p>;
  }

  return (
    <div>
      {allTasks.map(({ task, phaseName }) => (
        <div key={task.id} className="crm-pj-task-row">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <strong>{task.title}</strong>
              <span className={`crm-badge ${PROJECT_TASK_PRIORITY_BADGE[task.priority]}`}>
                {PROJECT_TASK_PRIORITY_LABEL[task.priority]}
              </span>
              <span className={`crm-badge ${PROJECT_TASK_STATUS_BADGE[task.status]}`}>
                {PROJECT_TASK_STATUS_LABEL[task.status]}
              </span>
            </div>
            <div className="crm-pj-desc">
              {phaseName}
              {task.dueAt ? ` · Prazo: ${formatDateTime(task.dueAt)}` : ""}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
