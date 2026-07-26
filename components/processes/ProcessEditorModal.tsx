"use client";

import { useActionState, useState } from "react";
import {
  createProcessAction,
  type ProcessActionState,
  updateProcessAction,
} from "@/application/processes/processesActions";
import { useProcessEditor } from "@/contexts/processes/ProcessEditorContext";
import type { ProcessFormOptions } from "@/services/processes/processesService";

const INITIAL_STATE: ProcessActionState = { status: "idle" };

export function ProcessEditorModal({ formOptions }: { formOptions: ProcessFormOptions }) {
  const { mode, editingProcess, close } = useProcessEditor();
  const open = mode !== "closed";
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState<string>("");

  const [state, formAction] = useActionState(
    async (prev: ProcessActionState, formData: FormData) => {
      const result =
        mode === "edit"
          ? await updateProcessAction(prev, formData)
          : await createProcessAction(prev, formData);
      if (result.status === "success") close();
      return result;
    },
    INITIAL_STATE,
  );

  if (!open) return null;

  function handleTemplateChange(templateId: string) {
    setSelectedTemplateId(templateId);
    const template = formOptions.templates.find((t) => t.id === templateId);
    if (template?.defaultEstimatedMinutes) {
      setEstimatedMinutes(String(template.defaultEstimatedMinutes));
    }
  }

  return (
    <>
      <button type="button" aria-label="Fechar" className="crm-modal-overlay" onClick={close} />
      <div className="crm-modal-center">
        <div
          className="crm-modal"
          role="dialog"
          aria-modal="true"
          aria-label={mode === "create" ? "Novo processo" : "Editar processo"}
          style={{ maxWidth: 560 }}
        >
          <div className="crm-modal-head">
            <span className="crm-modal-title">
              {mode === "create" ? "Novo processo" : "Editar processo"}
            </span>
          </div>

          <form action={formAction} className="crm-modal-form">
            {editingProcess && <input type="hidden" name="id" value={editingProcess.id} />}

            <div className="crm-field">
              <label htmlFor="proc-name">Nome *</label>
              <input
                id="proc-name"
                name="name"
                required
                defaultValue={editingProcess?.name ?? ""}
              />
            </div>

            <div className="crm-field">
              <label htmlFor="proc-description">Descrição</label>
              <textarea
                id="proc-description"
                name="description"
                rows={2}
                defaultValue={editingProcess?.description ?? ""}
              />
            </div>

            {mode === "create" && (
              <div className="crm-field">
                <label htmlFor="proc-template">Criar a partir de um template</label>
                <select
                  id="proc-template"
                  name="templateId"
                  value={selectedTemplateId}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                >
                  <option value="">Nenhum — processo em branco</option>
                  {formOptions.templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="crm-composer-row">
              <div className="crm-field">
                <label htmlFor="proc-category">Categoria</label>
                <select
                  id="proc-category"
                  name="categoryId"
                  defaultValue={editingProcess?.categoryId ?? ""}
                >
                  <option value="">Sem categoria</option>
                  {formOptions.categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="crm-field">
                <label htmlFor="proc-owner">Responsável</label>
                <select id="proc-owner" name="ownerId" defaultValue={editingProcess?.ownerId ?? ""}>
                  <option value="">Sem responsável</option>
                  {formOptions.owners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.name ?? "Sem nome"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="crm-field">
              <label htmlFor="proc-estimated">Tempo estimado (minutos)</label>
              <input
                id="proc-estimated"
                name="estimatedMinutes"
                type="number"
                min="0"
                value={estimatedMinutes || (editingProcess?.estimatedMinutes ?? "")}
                onChange={(e) => setEstimatedMinutes(e.target.value)}
              />
            </div>

            <div className="crm-composer-row">
              <div className="crm-field">
                <label htmlFor="proc-client">Cliente relacionado</label>
                <select
                  id="proc-client"
                  name="clientId"
                  defaultValue={editingProcess?.clientId ?? ""}
                >
                  <option value="">Nenhum</option>
                  {formOptions.clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.company}
                    </option>
                  ))}
                </select>
              </div>
              <div className="crm-field">
                <label htmlFor="proc-project">Projeto relacionado</label>
                <select
                  id="proc-project"
                  name="projectId"
                  defaultValue={editingProcess?.projectId ?? ""}
                >
                  <option value="">Nenhum</option>
                  {formOptions.projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="crm-field">
              <label htmlFor="proc-lead">Lead relacionado</label>
              <select
                id="proc-lead"
                name="crmLeadId"
                defaultValue={editingProcess?.crmLeadId ?? ""}
              >
                <option value="">Nenhum</option>
                {formOptions.leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.name}
                  </option>
                ))}
              </select>
            </div>

            {state.status === "error" && <div className="crm-field-error">{state.message}</div>}

            <div className="crm-modal-actions">
              <button type="button" className="btn btn-outline" onClick={close}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-accent">
                {mode === "create" ? "Criar processo" : "Salvar alterações"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
