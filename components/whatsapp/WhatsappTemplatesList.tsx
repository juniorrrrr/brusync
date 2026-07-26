"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import {
  createWhatsappTemplateAction,
  deleteWhatsappTemplateAction,
  syncWhatsappTemplatesAction,
  WHATSAPP_TEMPLATE_ACTION_INITIAL_STATE,
} from "@/application/whatsapp/whatsappTemplatesActions";
import { IconTrash } from "@/components/ui/icons";
import {
  TEMPLATE_CATEGORY_LABEL,
  TEMPLATE_STATUS_BADGE,
  TEMPLATE_STATUS_LABEL,
} from "@/domain/whatsapp/statusMeta";
import type { WhatsappTemplate, WhatsappTemplateCategory } from "@/types/whatsapp";

const CATEGORIES: WhatsappTemplateCategory[] = ["utility", "marketing", "authentication"];

function TemplateCard({ template }: { template: WhatsappTemplate }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const body = template.components.find((c) => c.type === "body")?.text ?? "";

  function remove() {
    startTransition(async () => {
      await deleteWhatsappTemplateAction(template.id);
      router.refresh();
    });
  }

  return (
    <div className="crm-card crm-card-pad">
      <div className="crm-int-card-top">
        <div>
          <div className="crm-int-card-title">{template.name}</div>
          <div className="crm-int-card-desc">
            {TEMPLATE_CATEGORY_LABEL[template.category]} · {template.language}
          </div>
        </div>
        <span className={`crm-badge ${TEMPLATE_STATUS_BADGE[template.status]}`}>
          {TEMPLATE_STATUS_LABEL[template.status]}
        </span>
      </div>
      <p className="crm-card-sub" style={{ whiteSpace: "pre-line" }}>
        {body}
      </p>
      <div className="crm-int-card-actions">
        <button type="button" className="crm-icon-btn" disabled={isPending} onClick={remove}>
          <IconTrash size={13} />
        </button>
      </div>
    </div>
  );
}

export function WhatsappTemplatesList({ templates }: { templates: WhatsappTemplate[] }) {
  const router = useRouter();
  const [isSyncing, startSync] = useTransition();
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [state, formAction] = useActionState(
    createWhatsappTemplateAction,
    WHATSAPP_TEMPLATE_ACTION_INITIAL_STATE,
  );

  function handleSync() {
    startSync(async () => {
      const result = await syncWhatsappTemplatesAction();
      setSyncMessage(result.message ?? null);
      router.refresh();
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="crm-page-head" style={{ marginBottom: 0 }}>
        <div>
          <div className="crm-card-title">Templates</div>
          <p className="crm-card-sub">{templates.length} template(s)</p>
        </div>
        <button type="button" className="btn btn-outline" disabled={isSyncing} onClick={handleSync}>
          Sincronizar com a Meta
        </button>
      </div>
      {syncMessage && <p className="crm-card-sub">{syncMessage}</p>}

      <form
        action={formAction}
        className="crm-card crm-card-pad crm-composer-row"
        style={{ flexWrap: "wrap", alignItems: "flex-end" }}
      >
        <div className="crm-field">
          <label htmlFor="tpl-name">Nome</label>
          <input id="tpl-name" name="name" placeholder="ex: boas_vindas" required />
        </div>
        <div className="crm-field">
          <label htmlFor="tpl-category">Categoria</label>
          <select id="tpl-category" name="category" defaultValue="utility">
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {TEMPLATE_CATEGORY_LABEL[category]}
              </option>
            ))}
          </select>
        </div>
        <div className="crm-field">
          <label htmlFor="tpl-language">Idioma</label>
          <input id="tpl-language" name="language" defaultValue="pt_BR" />
        </div>
        <div className="crm-field" style={{ flex: 1, minWidth: 240 }}>
          <label htmlFor="tpl-body">
            Corpo (use {"{{1}}"}, {"{{2}}"} para variáveis)
          </label>
          <textarea id="tpl-body" name="body" rows={2} required />
        </div>
        <button type="submit" className="btn btn-accent">
          Salvar rascunho
        </button>
        {state.status === "error" && <div className="crm-field-error">{state.message}</div>}
      </form>

      <div className="crm-int-grid">
        {templates.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
        {templates.length === 0 && (
          <div className="crm-card crm-card-pad">
            <p className="crm-card-sub">Nenhum template cadastrado ainda.</p>
          </div>
        )}
      </div>
    </div>
  );
}
