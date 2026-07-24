"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import {
  createTemplateAction,
  deleteTemplateAction,
} from "@/application/communication/communicationLookupsActions";
import { CHANNEL_TYPE_LABEL, CHANNEL_TYPES } from "@/domain/communication/types";
import type { MessageTemplate } from "@/types/communication";

const INITIAL_STATE: { status: "idle" | "success" | "error"; message?: string } = {
  status: "idle",
};

export function MessageTemplatesDialog({ templates }: { templates: MessageTemplate[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const [state, formAction] = useActionState(async (prev: typeof INITIAL_STATE, fd: FormData) => {
    const result = await createTemplateAction(prev, fd);
    if (result.status === "success") router.refresh();
    return result;
  }, INITIAL_STATE);

  async function handleDelete(id: string) {
    await deleteTemplateAction(id);
    router.refresh();
  }

  return (
    <>
      <button type="button" className="btn btn-outline" onClick={() => setOpen(true)}>
        Modelos de mensagem
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Fechar"
            className="crm-modal-overlay"
            onClick={() => setOpen(false)}
          />
          <div className="crm-modal-center">
            <div
              className="crm-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Modelos de mensagem"
              style={{ maxWidth: 520, maxHeight: "80vh", overflowY: "auto" }}
            >
              <div className="crm-modal-head">
                <span className="crm-modal-title">Modelos de mensagem</span>
              </div>

              <div style={{ padding: "0 24px 8px" }}>
                {templates.length === 0 && (
                  <p className="crm-card-sub">Nenhum modelo cadastrado ainda.</p>
                )}
                {templates.map((template) => (
                  <div key={template.id} className="crm-pj-row">
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{template.name}</div>
                      <div className="crm-pj-desc">{template.body}</div>
                    </div>
                    <div className="crm-pj-row-actions">
                      <button
                        type="button"
                        className="crm-pj-action-btn danger"
                        onClick={() => handleDelete(template.id)}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <form action={formAction} className="crm-modal-form" style={{ overflow: "visible" }}>
                <div className="crm-field">
                  <label htmlFor="tpl-name">Nome do modelo *</label>
                  <input id="tpl-name" name="name" required />
                </div>
                <div className="crm-field">
                  <label htmlFor="tpl-body">Texto *</label>
                  <textarea id="tpl-body" name="body" required rows={3} />
                </div>
                <div className="crm-field">
                  <label htmlFor="tpl-channel">Canal específico</label>
                  <select id="tpl-channel" name="channelType" defaultValue="">
                    <option value="">Qualquer canal</option>
                    {CHANNEL_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {CHANNEL_TYPE_LABEL[type]}
                      </option>
                    ))}
                  </select>
                </div>

                {state.status === "error" && <div className="crm-field-error">{state.message}</div>}

                <div className="crm-modal-actions">
                  <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>
                    Fechar
                  </button>
                  <button type="submit" className="btn btn-accent">
                    Criar modelo
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
}
