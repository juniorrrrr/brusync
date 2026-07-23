"use client";

import { useState } from "react";
import {
  deleteProjectAction,
  transitionProjectStatusAction,
} from "@/application/projects/projectsActions";
import { ProgressRing } from "@/components/crm/ProgressRing";
import { useProjectEditor } from "@/contexts/projects/ProjectEditorContext";
import { formatDateTime } from "@/domain/crm/format";
import { PROJECT_STATUS_LABEL, PROJECT_STATUSES } from "@/domain/projects/types";
import type { ProjectDetail, ProjectStatus } from "@/types/projects";

export function ProjectSummarySidebar({
  project,
  onChanged,
  onDeleted,
}: {
  project: ProjectDetail;
  onChanged: () => void;
  onDeleted: () => void;
}) {
  const { openEdit } = useProjectEditor();
  const [busy, setBusy] = useState(false);

  async function handleStatusChange(status: string) {
    setBusy(true);
    const result = await transitionProjectStatusAction(project.id, status as ProjectStatus);
    if (result.error) window.alert(result.error);
    onChanged();
    setBusy(false);
  }

  async function handleDelete() {
    if (!window.confirm(`Excluir o projeto "${project.name}" definitivamente?`)) return;
    setBusy(true);
    const result = await deleteProjectAction(project.id);
    if (result.error) {
      window.alert(result.error);
      setBusy(false);
      return;
    }
    onDeleted();
  }

  return (
    <div className="crm-drawer-section" style={{ marginTop: 0, paddingTop: 0, borderTop: "none" }}>
      <div className="crm-card-head">
        <div className="crm-drawer-section-title" style={{ marginBottom: 0 }}>
          Resumo
        </div>
        <button type="button" className="btn btn-outline" onClick={() => openEdit(project.id)}>
          Editar
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "center", margin: "12px 0" }}>
        <ProgressRing value={project.progressPercent} size={64} />
      </div>

      <div className="crm-info-list">
        <div className="crm-info-row">
          <span className="crm-info-row-label">Cliente</span>
          <span className="crm-info-row-value">{project.clientCompany ?? "—"}</span>
        </div>
        <div className="crm-info-row">
          <span className="crm-info-row-label">Responsável</span>
          <span className="crm-info-row-value">{project.ownerName ?? "Sem responsável"}</span>
        </div>
        <div className="crm-info-row">
          <span className="crm-info-row-label">Status</span>
          <span className="crm-info-row-value">
            <select
              className="crm-select"
              value={project.status}
              disabled={busy}
              onChange={(e) => handleStatusChange(e.target.value)}
              aria-label="Status do projeto"
            >
              {PROJECT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {PROJECT_STATUS_LABEL[status]}
                </option>
              ))}
            </select>
          </span>
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

      {project.description && (
        <p className="crm-pj-desc" style={{ marginTop: 12 }}>
          {project.description}
        </p>
      )}

      <button
        type="button"
        className="crm-pj-action-btn danger"
        style={{ marginTop: 16, width: "100%" }}
        onClick={handleDelete}
        disabled={busy}
      >
        Excluir projeto
      </button>
    </div>
  );
}
