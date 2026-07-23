"use client";

import { useActionState } from "react";
import { type ProjectActionState, saveProjectAction } from "@/application/projects/projectsActions";
import { ClientPicker } from "@/components/projects/ClientPicker";
import { useProjectEditor } from "@/contexts/projects/ProjectEditorContext";
import type { OwnerRef } from "@/types/crm";

const INITIAL_STATE: ProjectActionState = { status: "idle" };

function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export function ProjectEditorDialog({
  owners,
  onSaved,
}: {
  owners: OwnerRef[];
  onSaved: (projectId?: string) => void;
}) {
  const { mode, project, fixedClientId, fixedClientCompany, loading, error, close } =
    useProjectEditor();
  const open = mode !== "closed";

  const [state, formAction] = useActionState(async (prev: ProjectActionState, fd: FormData) => {
    const result = await saveProjectAction(prev, fd);
    if (result.status === "success") {
      onSaved(result.projectId);
      close();
    }
    return result;
  }, INITIAL_STATE);

  if (!open) return null;

  return (
    <>
      <button type="button" aria-label="Fechar" className="crm-modal-overlay" onClick={close} />
      <div className="crm-modal-center">
        <div
          className="crm-modal"
          role="dialog"
          aria-modal="true"
          aria-label={mode === "create" ? "Novo projeto" : "Editar projeto"}
          style={{ maxWidth: 520, overflow: "visible" }}
        >
          <div className="crm-modal-head">
            <span className="crm-modal-title">
              {mode === "create" ? "Novo projeto" : "Editar projeto"}
            </span>
          </div>

          {loading && <div className="crm-drawer-loading">Carregando…</div>}
          {!loading && error && <div className="crm-drawer-empty">{error}</div>}

          {!loading && !error && (
            <form action={formAction} className="crm-modal-form" style={{ overflow: "visible" }}>
              {project && <input type="hidden" name="id" value={project.id} />}

              {mode === "create" &&
                (fixedClientId ? (
                  <input type="hidden" name="clientId" value={fixedClientId} />
                ) : (
                  <ClientPicker name="clientId" />
                ))}

              {mode === "create" && fixedClientCompany && (
                <div className="crm-field">
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>
                    Cliente
                  </span>
                  <span>{fixedClientCompany}</span>
                </div>
              )}
              {mode === "edit" && project && (
                <div className="crm-field">
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>
                    Cliente
                  </span>
                  <span>{project.clientCompany}</span>
                </div>
              )}

              <div className="crm-field">
                <label htmlFor="project-name">Nome *</label>
                <input id="project-name" name="name" required defaultValue={project?.name ?? ""} />
              </div>

              <div className="crm-field">
                <label htmlFor="project-description">Descrição</label>
                <textarea
                  id="project-description"
                  name="description"
                  rows={2}
                  defaultValue={project?.description ?? ""}
                />
              </div>

              <div className="crm-composer-row">
                <div className="crm-field">
                  <label htmlFor="project-owner">Responsável</label>
                  <select id="project-owner" name="ownerId" defaultValue={project?.ownerId ?? ""}>
                    <option value="">Sem responsável</option>
                    {owners.map((owner) => (
                      <option key={owner.id} value={owner.id}>
                        {owner.name || owner.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="crm-field">
                  <label htmlFor="project-due">Prazo</label>
                  <input
                    id="project-due"
                    name="dueAt"
                    type="date"
                    defaultValue={toDateInputValue(project?.dueAt ?? null)}
                  />
                </div>
              </div>

              {state.status === "error" && <div className="crm-field-error">{state.message}</div>}

              <div className="crm-modal-actions">
                <button type="button" className="btn btn-outline" onClick={close}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-accent">
                  {mode === "create" ? "Criar projeto" : "Salvar alterações"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
