"use client";

import { useActionState, useState } from "react";
import {
  type CategoryActionState,
  deleteProcessCategoryAction,
  saveProcessCategoryAction,
} from "@/application/processes/processesCategoriesActions";
import { ProcessCategoryIcon } from "@/components/processes/ProcessCategoryIcon";
import { IconPlus } from "@/components/ui/icons";
import { PROCESS_CATEGORY_COLORS } from "@/domain/processes/statusMeta";
import type { ProcessCategory } from "@/types/processes";

const ICON_OPTIONS = [
  "folder",
  "target",
  "message",
  "check-circle",
  "wallet",
  "doc",
  "report",
  "users",
  "bolt",
  "tag",
  "server",
];

type DialogMode = "closed" | "create" | "edit";
const INITIAL_STATE: CategoryActionState = { status: "idle" };

/** Estado do diálogo é local a esta página (não precisa de um Context, ao
 * contrário de ProcessEditorContext, já que Categorias é uma única tela) —
 * combina a grade e o modal de criar/editar num único componente, mesmo
 * conteúdo de components/knowledge/KnowledgeCategoryGrid.tsx +
 * KnowledgeCategoryDialog.tsx, só que sem context próprio. */
export function ProcessCategoriesClient({ categories }: { categories: ProcessCategory[] }) {
  const [mode, setMode] = useState<DialogMode>("closed");
  const [editing, setEditing] = useState<ProcessCategory | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [state, formAction] = useActionState(
    async (prev: CategoryActionState, formData: FormData) => {
      const result = await saveProcessCategoryAction(prev, formData);
      if (result.status === "success") {
        setMode("closed");
        setEditing(null);
      }
      return result;
    },
    INITIAL_STATE,
  );

  function openEdit(category: ProcessCategory) {
    setEditing(category);
    setDeleteError(null);
    setMode("edit");
  }

  function openCreate() {
    setEditing(null);
    setDeleteError(null);
    setMode("create");
  }

  function close() {
    setMode("closed");
    setEditing(null);
  }

  async function handleDelete() {
    if (!editing) return;
    if (!confirm(`Remover a categoria "${editing.name}"?`)) return;
    const result = await deleteProcessCategoryAction(editing.id);
    if (!result.ok) {
      setDeleteError(result.error ?? "Falha ao remover categoria.");
      return;
    }
    close();
  }

  return (
    <>
      <div className="crm-proc-category-grid">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            className="crm-proc-category-card"
            onClick={() => openEdit(category)}
          >
            <ProcessCategoryIcon icon={category.icon} color={category.color} />
            <div>
              <div className="crm-proc-category-name">{category.name}</div>
              <div className="crm-proc-category-count">{category.processCount} processos</div>
            </div>
          </button>
        ))}

        <button type="button" className="crm-proc-category-card" onClick={openCreate}>
          <span className="crm-proc-category-ico" style={{ background: "var(--surface)" }}>
            <IconPlus size={16} />
          </span>
          <div>
            <div className="crm-proc-category-name">Nova categoria</div>
            <div className="crm-proc-category-count">Personalizada</div>
          </div>
        </button>
      </div>

      {mode !== "closed" && (
        <>
          <button type="button" aria-label="Fechar" className="crm-modal-overlay" onClick={close} />
          <div className="crm-modal-center">
            <div
              className="crm-modal"
              role="dialog"
              aria-modal="true"
              aria-label={mode === "create" ? "Nova categoria" : "Editar categoria"}
              style={{ maxWidth: 440 }}
            >
              <div className="crm-modal-head">
                <span className="crm-modal-title">
                  {mode === "create" ? "Nova categoria" : "Editar categoria"}
                </span>
              </div>

              <form action={formAction} className="crm-modal-form">
                {editing && <input type="hidden" name="id" value={editing.id} />}

                <div className="crm-field">
                  <label htmlFor="pc-name">Nome *</label>
                  <input id="pc-name" name="name" required defaultValue={editing?.name ?? ""} />
                </div>

                <div className="crm-field">
                  <label htmlFor="pc-description">Descrição</label>
                  <input
                    id="pc-description"
                    name="description"
                    defaultValue={editing?.description ?? ""}
                  />
                </div>

                <div className="crm-composer-row">
                  <div className="crm-field">
                    <label htmlFor="pc-icon">Ícone</label>
                    <select id="pc-icon" name="icon" defaultValue={editing?.icon ?? "folder"}>
                      {ICON_OPTIONS.map((icon) => (
                        <option key={icon} value={icon}>
                          {icon}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="crm-field">
                    <label htmlFor="pc-color">Cor</label>
                    <select id="pc-color" name="color" defaultValue={editing?.color ?? "neutral"}>
                      {PROCESS_CATEGORY_COLORS.map((color) => (
                        <option key={color} value={color}>
                          {color}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {state.status === "error" && <div className="crm-field-error">{state.message}</div>}
                {deleteError && <div className="crm-field-error">{deleteError}</div>}

                <div className="crm-modal-actions" style={{ justifyContent: "space-between" }}>
                  {mode === "edit" && editing && !editing.isDefault ? (
                    <button type="button" className="btn btn-outline" onClick={handleDelete}>
                      Remover
                    </button>
                  ) : (
                    <span />
                  )}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" className="btn btn-outline" onClick={close}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-accent">
                      {mode === "create" ? "Criar categoria" : "Salvar alterações"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
}
