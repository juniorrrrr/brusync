"use client";

import { transitionTaskStatusAction } from "@/application/projects/projectTasksActions";
import { useProjectTaskDialog } from "@/contexts/projects/ProjectTaskDialogContext";
import { formatDateTime } from "@/domain/crm/format";
import {
  PROJECT_TASK_PRIORITY_BADGE,
  PROJECT_TASK_PRIORITY_LABEL,
  PROJECT_TASK_STATUS_BADGE,
  PROJECT_TASK_STATUS_LABEL,
} from "@/domain/projects/types";
import type { ProjectDetail } from "@/types/projects";

/** Flat, project-wide view of every task across every phase — a quick
 * checklist glance, distinct from the Etapas tab's per-phase breakdown. */
export function ProjectChecklistTab({
  project,
  onChanged,
}: {
  project: ProjectDetail;
  onChanged: () => void;
}) {
  const { openEdit } = useProjectTaskDialog();

  async function handleToggle(taskId: string, currentStatus: string) {
    const next = currentStatus === "concluido" ? "pendente" : "concluido";
    const result = await transitionTaskStatusAction(taskId, next as "pendente" | "concluido");
    if (result.error) window.alert(result.error);
    onChanged();
  }

  const allTasks = project.phases.flatMap((phase) =>
    phase.tasks.map((task) => ({ task, phaseName: phase.name })),
  );

  if (allTasks.length === 0) {
    return <p className="crm-card-sub">Nenhuma tarefa criada ainda.</p>;
  }

  return (
    <div>
      {allTasks.map(({ task, phaseName }) => (
        <div key={task.id} className="crm-pj-task-row">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <input
                type="checkbox"
                checked={task.status === "concluido"}
                onChange={() => handleToggle(task.id, task.status)}
                aria-label="Concluir tarefa"
              />
              <strong>{task.title}</strong>
              <span className={`crm-badge ${PROJECT_TASK_PRIORITY_BADGE[task.priority]}`}>
                {PROJECT_TASK_PRIORITY_LABEL[task.priority]}
              </span>
              <span className={`crm-badge ${PROJECT_TASK_STATUS_BADGE[task.status]}`}>
                {PROJECT_TASK_STATUS_LABEL[task.status]}
              </span>
            </div>
            <div className="crm-pj-desc">
              {phaseName} · {task.assigneeName ?? "Sem responsável"}
              {task.dueAt ? ` · Prazo: ${formatDateTime(task.dueAt)}` : ""}
            </div>
          </div>
          <button type="button" className="crm-pj-action-btn" onClick={() => openEdit(task)}>
            Abrir
          </button>
        </div>
      ))}
    </div>
  );
}
