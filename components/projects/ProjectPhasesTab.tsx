"use client";

import { useActionState, useState } from "react";
import {
  deletePhaseAction,
  movePhaseAction,
  type PhaseActionState,
  savePhaseAction,
  transitionPhaseStatusAction,
} from "@/application/projects/projectPhasesActions";
import { transitionTaskStatusAction } from "@/application/projects/projectTasksActions";
import { useProjectTaskDialog } from "@/contexts/projects/ProjectTaskDialogContext";
import { formatDateTime } from "@/domain/crm/format";
import {
  PROJECT_PHASE_STATUS_BADGE,
  PROJECT_PHASE_STATUS_LABEL,
  PROJECT_PHASE_STATUSES,
  PROJECT_TASK_PRIORITY_BADGE,
  PROJECT_TASK_PRIORITY_LABEL,
  PROJECT_TASK_STATUS_BADGE,
  PROJECT_TASK_STATUS_LABEL,
} from "@/domain/projects/types";
import type { ProjectDetail, ProjectPhase, ProjectPhaseStatus } from "@/types/projects";

const PHASE_INITIAL_STATE: PhaseActionState = { status: "idle" };

function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function PhaseEditorModal({
  projectId,
  phase,
  onClose,
  onSaved,
}: {
  projectId: string;
  phase: ProjectPhase | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [state, formAction] = useActionState(async (prev: PhaseActionState, fd: FormData) => {
    const result = await savePhaseAction(prev, fd);
    if (result.status === "success") {
      onSaved();
      onClose();
    }
    return result;
  }, PHASE_INITIAL_STATE);

  return (
    <>
      <button type="button" aria-label="Fechar" className="crm-modal-overlay" onClick={onClose} />
      <div className="crm-modal-center">
        <div className="crm-modal" role="dialog" aria-modal="true" aria-label="Etapa">
          <div className="crm-modal-head">
            <span className="crm-modal-title">{phase ? "Editar etapa" : "Nova etapa"}</span>
          </div>
          <form action={formAction} className="crm-modal-form">
            {phase && <input type="hidden" name="id" value={phase.id} />}
            <input type="hidden" name="projectId" value={projectId} />
            <div className="crm-field">
              <label htmlFor="phase-name">Nome *</label>
              <input id="phase-name" name="name" required defaultValue={phase?.name ?? ""} />
            </div>
            <div className="crm-field">
              <label htmlFor="phase-due">Data prevista</label>
              <input
                id="phase-due"
                name="dueAt"
                type="date"
                defaultValue={toDateInputValue(phase?.dueAt ?? null)}
              />
            </div>
            {state.status === "error" && <div className="crm-field-error">{state.message}</div>}
            <div className="crm-modal-actions">
              <button type="button" className="btn btn-outline" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-accent">
                {phase ? "Salvar" : "Criar etapa"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

function PhaseCard({
  phase,
  isFirst,
  isLast,
  onChanged,
}: {
  phase: ProjectPhase;
  isFirst: boolean;
  isLast: boolean;
  onChanged: () => void;
}) {
  const { openCreate, openEdit } = useProjectTaskDialog();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleMove(direction: "up" | "down") {
    setBusy(true);
    const result = await movePhaseAction(phase.projectId, phase.id, direction);
    if (result.error) window.alert(result.error);
    onChanged();
    setBusy(false);
  }

  async function handleStatusChange(status: string) {
    setBusy(true);
    const result = await transitionPhaseStatusAction(
      phase.id,
      status as ProjectPhaseStatus,
      phase.startedAt,
    );
    if (result.error) window.alert(result.error);
    onChanged();
    setBusy(false);
  }

  async function handleDelete() {
    if (
      !window.confirm(`Excluir a etapa "${phase.name}"? As tarefas dela também serão excluídas.`)
    ) {
      return;
    }
    setBusy(true);
    const result = await deletePhaseAction(phase.id);
    if (result.error) window.alert(result.error);
    onChanged();
    setBusy(false);
  }

  async function handleTaskToggle(taskId: string, currentStatus: string) {
    const next = currentStatus === "concluido" ? "pendente" : "concluido";
    const result = await transitionTaskStatusAction(taskId, next as "pendente" | "concluido");
    if (result.error) window.alert(result.error);
    onChanged();
  }

  return (
    <div className="crm-pj-phase-card">
      <div className="crm-pj-phase-head">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <strong>{phase.name}</strong>
            <span className={`crm-badge ${PROJECT_PHASE_STATUS_BADGE[phase.status]}`}>
              {PROJECT_PHASE_STATUS_LABEL[phase.status]}
            </span>
            <span className="crm-card-sub" style={{ margin: 0 }}>
              {phase.progressPercent}%
            </span>
          </div>
          <div className="crm-pj-phase-dates">
            <span>Início: {phase.startedAt ? formatDateTime(phase.startedAt) : "—"}</span>
            <span>Previsão: {phase.dueAt ? formatDateTime(phase.dueAt) : "—"}</span>
            <span>Final: {phase.completedAt ? formatDateTime(phase.completedAt) : "—"}</span>
          </div>
          <div className="crm-pj-progress-track" style={{ marginTop: 8, maxWidth: 240 }}>
            <div className="crm-pj-progress-fill" style={{ width: `${phase.progressPercent}%` }} />
          </div>
        </div>
        <div className="crm-pj-row-actions">
          <select
            className="crm-select"
            value={phase.status}
            disabled={busy}
            onChange={(e) => handleStatusChange(e.target.value)}
            aria-label="Status da etapa"
          >
            {PROJECT_PHASE_STATUSES.map((value) => (
              <option key={value} value={value}>
                {PROJECT_PHASE_STATUS_LABEL[value]}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="crm-pj-action-btn"
            onClick={() => handleMove("up")}
            disabled={busy || isFirst}
          >
            ↑
          </button>
          <button
            type="button"
            className="crm-pj-action-btn"
            onClick={() => handleMove("down")}
            disabled={busy || isLast}
          >
            ↓
          </button>
          <button
            type="button"
            className="crm-pj-action-btn"
            onClick={() => setEditing(true)}
            disabled={busy}
          >
            Editar
          </button>
          <button
            type="button"
            className="crm-pj-action-btn danger"
            onClick={handleDelete}
            disabled={busy}
          >
            Excluir
          </button>
        </div>
      </div>

      {phase.tasks.map((task) => (
        <div key={task.id} className="crm-pj-task-row">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <input
                type="checkbox"
                checked={task.status === "concluido"}
                onChange={() => handleTaskToggle(task.id, task.status)}
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
              {task.assigneeName ?? "Sem responsável"}
              {task.dueAt ? ` · Prazo: ${formatDateTime(task.dueAt)}` : ""}
              {task.comments.length > 0 ? ` · ${task.comments.length} comentário(s)` : ""}
              {task.fileCount > 0 ? ` · ${task.fileCount} arquivo(s)` : ""}
            </div>
          </div>
          <button type="button" className="crm-pj-action-btn" onClick={() => openEdit(task)}>
            Abrir
          </button>
        </div>
      ))}

      <button
        type="button"
        className="crm-pj-action-btn"
        style={{ marginTop: 10 }}
        onClick={() => openCreate(phase.id)}
      >
        Nova tarefa
      </button>

      {editing && (
        <PhaseEditorModal
          projectId={phase.projectId}
          phase={phase}
          onClose={() => setEditing(false)}
          onSaved={onChanged}
        />
      )}
    </div>
  );
}

export function ProjectPhasesTab({
  project,
  onChanged,
}: {
  project: ProjectDetail;
  onChanged: () => void;
}) {
  const [creatingPhase, setCreatingPhase] = useState(false);

  return (
    <div>
      {project.phases.map((phase, index) => (
        <PhaseCard
          key={phase.id}
          phase={phase}
          isFirst={index === 0}
          isLast={index === project.phases.length - 1}
          onChanged={onChanged}
        />
      ))}

      <button type="button" className="btn btn-outline" onClick={() => setCreatingPhase(true)}>
        Nova etapa
      </button>

      {creatingPhase && (
        <PhaseEditorModal
          projectId={project.id}
          phase={null}
          onClose={() => setCreatingPhase(false)}
          onSaved={onChanged}
        />
      )}
    </div>
  );
}
