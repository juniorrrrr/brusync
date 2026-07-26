"use client";

import { useActionState, useState } from "react";
import {
  deleteProcessTemplateAction,
  saveProcessTemplateAction,
  type TemplateActionState,
} from "@/application/processes/processesTemplatesActions";
import { IconPlus, IconTrash } from "@/components/ui/icons";
import type { ProcessCategory, ProcessTemplate } from "@/types/processes";

interface StepDraft {
  name: string;
  checklistText: string;
}

const INITIAL_STATE: TemplateActionState = { status: "idle" };

function templateToDraft(template: ProcessTemplate | null): StepDraft[] {
  if (!template || template.stepsBlueprint.length === 0) {
    return [{ name: "", checklistText: "" }];
  }
  return template.stepsBlueprint.map((step) => ({
    name: step.name,
    checklistText: step.checklist.map((item) => item.label).join("\n"),
  }));
}

function TemplateForm({
  template,
  categories,
  onDone,
}: {
  template: ProcessTemplate | null;
  categories: ProcessCategory[];
  onDone: () => void;
}) {
  const [steps, setSteps] = useState<StepDraft[]>(templateToDraft(template));

  const [state, formAction] = useActionState(
    async (prev: TemplateActionState, formData: FormData) => {
      const blueprint = steps
        .filter((step) => step.name.trim())
        .map((step) => ({
          name: step.name.trim(),
          checklist: step.checklistText
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean),
        }));
      formData.set("stepsBlueprint", JSON.stringify(blueprint));

      const result = await saveProcessTemplateAction(prev, formData);
      if (result.status === "success") onDone();
      return result;
    },
    INITIAL_STATE,
  );

  return (
    <form action={formAction} className="crm-modal-form">
      {template && <input type="hidden" name="id" value={template.id} />}

      <div className="crm-field">
        <label htmlFor="tpl-name">Nome *</label>
        <input id="tpl-name" name="name" required defaultValue={template?.name ?? ""} />
      </div>

      <div className="crm-field">
        <label htmlFor="tpl-description">Descrição</label>
        <input id="tpl-description" name="description" defaultValue={template?.description ?? ""} />
      </div>

      <div className="crm-composer-row">
        <div className="crm-field">
          <label htmlFor="tpl-category">Categoria</label>
          <select id="tpl-category" name="categoryId" defaultValue={template?.categoryId ?? ""}>
            <option value="">Sem categoria</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="crm-field">
          <label htmlFor="tpl-estimated">Tempo estimado padrão (minutos)</label>
          <input
            id="tpl-estimated"
            name="defaultEstimatedMinutes"
            type="number"
            min="0"
            defaultValue={template?.defaultEstimatedMinutes ?? ""}
          />
        </div>
      </div>

      <div className="crm-field">
        <span>Etapas e checklist</span>
        <div className="crm-proc-template-steps">
          {steps.map((step, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: rascunho local reordenado só por adição/remoção no fim
            <div key={index} className="crm-proc-template-step">
              <div className="crm-composer-row">
                <input
                  placeholder={`Nome da etapa ${index + 1}`}
                  value={step.name}
                  onChange={(e) => {
                    const next = [...steps];
                    next[index] = { ...next[index], name: e.target.value };
                    setSteps(next);
                  }}
                />
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setSteps(steps.filter((_, i) => i !== index))}
                  disabled={steps.length === 1}
                  aria-label="Remover etapa"
                >
                  <IconTrash size={13} />
                </button>
              </div>
              <textarea
                rows={2}
                placeholder="Um item de checklist por linha"
                value={step.checklistText}
                onChange={(e) => {
                  const next = [...steps];
                  next[index] = { ...next[index], checklistText: e.target.value };
                  setSteps(next);
                }}
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          className="btn btn-outline"
          style={{ marginTop: 8 }}
          onClick={() => setSteps([...steps, { name: "", checklistText: "" }])}
        >
          <IconPlus size={13} /> Adicionar etapa
        </button>
      </div>

      {state.status === "error" && <div className="crm-field-error">{state.message}</div>}

      <div className="crm-modal-actions">
        <button type="button" className="btn btn-outline" onClick={onDone}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-accent">
          {template ? "Salvar alterações" : "Criar template"}
        </button>
      </div>
    </form>
  );
}

export function ProcessTemplatesClient({
  templates,
  categories,
}: {
  templates: ProcessTemplate[];
  categories: ProcessCategory[];
}) {
  const [mode, setMode] = useState<"closed" | "create" | "edit">("closed");
  const [editing, setEditing] = useState<ProcessTemplate | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDelete(template: ProcessTemplate) {
    if (!confirm(`Remover o template "${template.name}"?`)) return;
    const result = await deleteProcessTemplateAction(template.id);
    if (!result.ok) setDeleteError(result.error ?? "Falha ao remover template.");
  }

  return (
    <>
      <div className="crm-card-head">
        <div className="crm-card-title">Templates ({templates.length})</div>
        <button
          type="button"
          className="btn btn-accent"
          onClick={() => {
            setEditing(null);
            setMode("create");
          }}
        >
          <IconPlus size={14} /> Novo template
        </button>
      </div>

      {deleteError && <div className="crm-field-error">{deleteError}</div>}

      <div className="crm-int-grid" style={{ marginTop: 12 }}>
        {templates.map((template) => (
          <div key={template.id} className="crm-card crm-card-pad crm-proc-card">
            <div className="crm-int-card-top">
              <div>
                <div className="crm-int-card-title">{template.name}</div>
                <div className="crm-int-card-desc">
                  {template.categoryName ?? "Sem categoria"} · {template.stepsBlueprint.length}{" "}
                  etapa(s)
                </div>
              </div>
            </div>
            {template.description && <p className="crm-card-sub">{template.description}</p>}
            <div className="crm-int-card-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setEditing(template);
                  setMode("edit");
                }}
              >
                Editar
              </button>
              {!template.isDefault && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => handleDelete(template)}
                >
                  <IconTrash size={13} /> Remover
                </button>
              )}
            </div>
          </div>
        ))}
        {templates.length === 0 && <p className="crm-card-sub">Nenhum template criado ainda.</p>}
      </div>

      {mode !== "closed" && (
        <>
          <button
            type="button"
            aria-label="Fechar"
            className="crm-modal-overlay"
            onClick={() => setMode("closed")}
          />
          <div className="crm-modal-center">
            <div
              className="crm-modal"
              role="dialog"
              aria-modal="true"
              aria-label={mode === "create" ? "Novo template" : "Editar template"}
              style={{ maxWidth: 600 }}
            >
              <div className="crm-modal-head">
                <span className="crm-modal-title">
                  {mode === "create" ? "Novo template" : "Editar template"}
                </span>
              </div>
              <TemplateForm
                template={editing}
                categories={categories}
                onDone={() => setMode("closed")}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}
