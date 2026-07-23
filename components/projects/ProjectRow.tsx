"use client";

import { deleteProjectAction } from "@/application/projects/projectsActions";
import { useClientDrawer } from "@/contexts/crm/ClientDrawerContext";
import { useProjectDrawer } from "@/contexts/projects/ProjectDrawerContext";
import { formatDateTime } from "@/domain/crm/format";
import { PROJECT_STATUS_BADGE, PROJECT_STATUS_LABEL } from "@/domain/projects/types";
import type { Project } from "@/types/projects";

export function ProjectRow({ project, onChanged }: { project: Project; onChanged: () => void }) {
  const { openProject } = useProjectDrawer();
  // Harmless no-op when there's no Cliente drawer open (the main /projetos
  // list also uses this row) — but when this row is inside the Cliente
  // drawer's own Projetos section, it prevents both drawers stacking open
  // at once.
  const { close: closeClientDrawer } = useClientDrawer();

  function handleOpen() {
    closeClientDrawer();
    openProject(project.id);
  }

  const isOverdue =
    project.dueAt &&
    new Date(project.dueAt).getTime() < Date.now() &&
    project.status !== "concluido" &&
    project.status !== "cancelado";

  async function handleDelete() {
    if (!window.confirm(`Excluir o projeto "${project.name}" definitivamente?`)) return;
    const result = await deleteProjectAction(project.id);
    if (result.error) window.alert(result.error);
    onChanged();
  }

  return (
    <div className="crm-pj-row">
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className="crm-back-link"
            style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}
            onClick={handleOpen}
          >
            {project.name}
          </button>
          <span className={`crm-badge ${PROJECT_STATUS_BADGE[project.status]}`}>
            {PROJECT_STATUS_LABEL[project.status]}
          </span>
          {isOverdue && (
            <span className="crm-badge danger" style={{ fontSize: 10 }}>
              Atrasado
            </span>
          )}
        </div>
        <div className="crm-pj-desc">
          {project.clientCompany ?? "Sem cliente"} · {project.ownerName ?? "Sem responsável"}
          {project.dueAt ? ` · Prazo: ${formatDateTime(project.dueAt)}` : ""}
          {` · Criado em ${formatDateTime(project.createdAt)}`}
        </div>
        <div className="crm-pj-progress-track" style={{ marginTop: 8, maxWidth: 280 }}>
          <div className="crm-pj-progress-fill" style={{ width: `${project.progressPercent}%` }} />
        </div>
      </div>
      <div className="crm-pj-row-actions">
        <span className="crm-card-sub" style={{ margin: 0 }}>
          {project.progressPercent}%
        </span>
        <button type="button" className="crm-pj-action-btn" onClick={handleOpen}>
          Abrir
        </button>
        <button type="button" className="crm-pj-action-btn danger" onClick={handleDelete}>
          Excluir
        </button>
      </div>
    </div>
  );
}
