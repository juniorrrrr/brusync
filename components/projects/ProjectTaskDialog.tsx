"use client";

import { useActionState, useState } from "react";
import {
  addTaskCommentAction,
  saveTaskAction,
  type TaskActionState,
  transitionTaskStatusAction,
} from "@/application/projects/projectTasksActions";
import { useProjectTaskDialog } from "@/contexts/projects/ProjectTaskDialogContext";
import { formatDateTime } from "@/domain/crm/format";
import {
  PROJECT_TASK_PRIORITIES,
  PROJECT_TASK_PRIORITY_LABEL,
  PROJECT_TASK_STATUS_LABEL,
  PROJECT_TASK_STATUSES,
} from "@/domain/projects/types";
import type { OwnerRef } from "@/types/crm";

const INITIAL_STATE: TaskActionState = { status: "idle" };

function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export function ProjectTaskDialog({
  projectId,
  owners,
  onSaved,
}: {
  projectId: string;
  owners: OwnerRef[];
  onSaved: () => void;
}) {
  const { mode, task, phaseId, close } = useProjectTaskDialog();
  const open = mode !== "closed";
  const [commentBody, setCommentBody] = useState("");
  const [commentPending, setCommentPending] = useState(false);

  const [state, formAction] = useActionState(async (prev: TaskActionState, fd: FormData) => {
    const result = await saveTaskAction(prev, fd);
    if (result.status === "success") {
      onSaved();
      close();
    }
    return result;
  }, INITIAL_STATE);

  async function handleStatusChange(status: string) {
    if (!task) return;
    const result = await transitionTaskStatusAction(
      task.id,
      status as (typeof PROJECT_TASK_STATUSES)[number],
    );
    if (result.error) window.alert(result.error);
    onSaved();
  }

  async function handleAddComment() {
    if (!task || !commentBody.trim()) return;
    setCommentPending(true);
    const result = await addTaskCommentAction(task.id, commentBody.trim());
    if (result.error) window.alert(result.error);
    setCommentBody("");
    onSaved();
    setCommentPending(false);
  }

  if (!open) return null;

  return (
    <>
      <button type="button" aria-label="Fechar" className="crm-modal-overlay" onClick={close} />
      <div className="crm-modal-center">
        <div
          className="crm-modal"
          role="dialog"
          aria-modal="true"
          aria-label={mode === "create" ? "Nova tarefa" : "Editar tarefa"}
          style={{ maxWidth: 520 }}
        >
          <div className="crm-modal-head">
            <span className="crm-modal-title">
              {mode === "create" ? "Nova tarefa" : "Editar tarefa"}
            </span>
          </div>

          <form action={formAction} className="crm-modal-form">
            {task && <input type="hidden" name="id" value={task.id} />}
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="phaseId" value={phaseId ?? ""} />

            <div className="crm-field">
              <label htmlFor="task-title">Título *</label>
              <input id="task-title" name="title" required defaultValue={task?.title ?? ""} />
            </div>

            <div className="crm-field">
              <label htmlFor="task-description">Descrição</label>
              <textarea
                id="task-description"
                name="description"
                rows={2}
                defaultValue={task?.description ?? ""}
              />
            </div>

            <div className="crm-composer-row">
              <div className="crm-field">
                <label htmlFor="task-assignee">Responsável</label>
                <select id="task-assignee" name="assigneeId" defaultValue={task?.assigneeId ?? ""}>
                  <option value="">Sem responsável</option>
                  {owners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.name || owner.email}
                    </option>
                  ))}
                </select>
              </div>
              <div className="crm-field">
                <label htmlFor="task-priority">Prioridade</label>
                <select id="task-priority" name="priority" defaultValue={task?.priority ?? "media"}>
                  {PROJECT_TASK_PRIORITIES.map((value) => (
                    <option key={value} value={value}>
                      {PROJECT_TASK_PRIORITY_LABEL[value]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="crm-field">
              <label htmlFor="task-due">Prazo</label>
              <input
                id="task-due"
                name="dueAt"
                type="date"
                defaultValue={toDateInputValue(task?.dueAt ?? null)}
              />
            </div>

            {task && (
              <div className="crm-field">
                <label htmlFor="task-status">Status</label>
                <select
                  id="task-status"
                  defaultValue={task.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                >
                  {PROJECT_TASK_STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {PROJECT_TASK_STATUS_LABEL[value]}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {state.status === "error" && <div className="crm-field-error">{state.message}</div>}

            <div className="crm-modal-actions">
              <button type="button" className="btn btn-outline" onClick={close}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-accent">
                {mode === "create" ? "Criar tarefa" : "Salvar alterações"}
              </button>
            </div>
          </form>

          {task && (
            <div className="crm-drawer-section" style={{ padding: "0 24px 20px" }}>
              <div className="crm-drawer-section-title">Comentários</div>
              {task.comments.length === 0 && (
                <p className="crm-card-sub" style={{ marginTop: 6 }}>
                  Nenhum comentário ainda.
                </p>
              )}
              {task.comments.map((comment) => (
                <div key={comment.id} className="crm-pj-comment">
                  <div className="crm-pj-comment-meta">
                    {comment.authorName ?? "Sistema"} · {formatDateTime(comment.createdAt)}
                  </div>
                  {comment.body}
                </div>
              ))}
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <input
                  className="crm-select"
                  style={{ flex: 1 }}
                  placeholder="Adicionar comentário…"
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                />
                <button
                  type="button"
                  className="crm-pj-action-btn"
                  onClick={handleAddComment}
                  disabled={commentPending || !commentBody.trim()}
                >
                  Comentar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
