"use client";

import { useActionState, useState } from "react";
import {
  type CategoryActionState,
  deleteCategoryAction,
  saveCategoryAction,
} from "@/application/knowledge/knowledgeCategoriesActions";
import { useKnowledgeCategoryDialog } from "@/contexts/knowledge/KnowledgeCategoryDialogContext";
import { KNOWLEDGE_CATEGORY_COLORS } from "@/domain/knowledge/types";

const INITIAL_STATE: CategoryActionState = { status: "idle" };

export function KnowledgeCategoryDialog() {
  const { mode, category, close } = useKnowledgeCategoryDialog();
  const open = mode !== "closed";
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [state, formAction] = useActionState(async (prev: CategoryActionState, fd: FormData) => {
    const result = await saveCategoryAction(prev, fd);
    if (result.status === "success") close();
    return result;
  }, INITIAL_STATE);

  if (!open) return null;

  async function handleDelete() {
    if (!category) return;
    if (!confirm(`Remover a categoria "${category.name}"?`)) return;
    const result = await deleteCategoryAction(category.id);
    if (!result.ok) {
      setDeleteError(result.error ?? "Falha ao remover categoria.");
      return;
    }
    close();
  }

  return (
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
            {category && <input type="hidden" name="id" value={category.id} />}

            <div className="crm-field">
              <label htmlFor="cat-name">Nome *</label>
              <input id="cat-name" name="name" required defaultValue={category?.name ?? ""} />
            </div>

            <div className="crm-field">
              <label htmlFor="cat-description">Descrição</label>
              <input
                id="cat-description"
                name="description"
                defaultValue={category?.description ?? ""}
              />
            </div>

            <div className="crm-composer-row">
              <div className="crm-field">
                <label htmlFor="cat-icon">Ícone</label>
                <select id="cat-icon" name="icon" defaultValue={category?.icon ?? "doc"}>
                  {[
                    "doc",
                    "target",
                    "report",
                    "wallet",
                    "bolt",
                    "users",
                    "server",
                    "lock",
                    "book",
                    "archive",
                  ].map((icon) => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </select>
              </div>
              <div className="crm-field">
                <label htmlFor="cat-color">Cor</label>
                <select id="cat-color" name="color" defaultValue={category?.color ?? "neutral"}>
                  {KNOWLEDGE_CATEGORY_COLORS.map((color) => (
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
              {mode === "edit" && category && !category.isDefault ? (
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
  );
}
