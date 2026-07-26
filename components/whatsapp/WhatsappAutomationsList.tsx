"use client";

import { useRouter } from "next/navigation";
import { useActionState, useTransition } from "react";
import {
  createWhatsappAutomationAction,
  deleteWhatsappAutomationAction,
  WHATSAPP_AUTOMATION_ACTION_INITIAL_STATE,
} from "@/application/whatsapp/whatsappAutomationsActions";
import { IconTrash } from "@/components/ui/icons";
import {
  AUTOMATION_TRIGGER_LABEL,
  AUTOMATION_TRIGGERS,
  AUTOMATION_TRIGGERS_LIVE,
} from "@/domain/whatsapp/statusMeta";
import { useWhatsappAutomationToggle } from "@/hooks/whatsapp/useWhatsappAutomationToggle";
import type { WhatsappAutomation, WhatsappTemplate } from "@/types/whatsapp";

function AutomationRow({ automation }: { automation: WhatsappAutomation }) {
  const router = useRouter();
  const { active, toggle } = useWhatsappAutomationToggle(
    automation.id,
    automation.status === "ativo",
  );
  const [isPending, startTransition] = useTransition();
  const isLive = AUTOMATION_TRIGGERS_LIVE.includes(automation.triggerType);

  function remove() {
    startTransition(async () => {
      await deleteWhatsappAutomationAction(automation.id);
      router.refresh();
    });
  }

  return (
    <div className="crm-an-row">
      <div>
        <strong>{AUTOMATION_TRIGGER_LABEL[automation.triggerType]}</strong>
        <div className="crm-card-sub">
          Template: {automation.templateName ?? "—"}
          {!isLive && " · sem disparo automático nesta fase"}
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <button
          type="button"
          className={`btn ${active ? "btn-accent" : "btn-outline"}`}
          onClick={toggle}
        >
          {active ? "Ativo" : "Inativo"}
        </button>
        <button type="button" className="crm-icon-btn" disabled={isPending} onClick={remove}>
          <IconTrash size={13} />
        </button>
      </div>
    </div>
  );
}

export function WhatsappAutomationsList({
  automations,
  templates,
}: {
  automations: WhatsappAutomation[];
  templates: WhatsappTemplate[];
}) {
  const [state, formAction] = useActionState(
    createWhatsappAutomationAction,
    WHATSAPP_AUTOMATION_ACTION_INITIAL_STATE,
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="crm-card crm-card-pad">
        <div className="crm-card-title">Nova automação</div>
        <p className="crm-card-sub">
          Reaproveita a Central de Automações — ao ocorrer o gatilho, o template escolhido é enviado
          automaticamente para o lead.
        </p>
        <form
          action={formAction}
          className="crm-composer-row"
          style={{ marginTop: 10, alignItems: "flex-end" }}
        >
          <div className="crm-field">
            <label htmlFor="auto-trigger">Gatilho</label>
            <select id="auto-trigger" name="triggerType" defaultValue={AUTOMATION_TRIGGERS[0]}>
              {AUTOMATION_TRIGGERS.map((trigger) => (
                <option key={trigger} value={trigger}>
                  {AUTOMATION_TRIGGER_LABEL[trigger]}
                </option>
              ))}
            </select>
          </div>
          <div className="crm-field">
            <label htmlFor="auto-template">Template</label>
            <select id="auto-template" name="templateId" defaultValue="">
              <option value="">Selecione</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-accent">
            Criar automação
          </button>
        </form>
        {state.status === "error" && <div className="crm-field-error">{state.message}</div>}
      </div>

      <div className="crm-card crm-card-pad">
        <div className="crm-card-title">Automações configuradas</div>
        <div className="crm-mini-list" style={{ marginTop: 10 }}>
          {automations.map((automation) => (
            <AutomationRow key={automation.id} automation={automation} />
          ))}
          {automations.length === 0 && (
            <p className="crm-card-sub">Nenhuma automação configurada ainda.</p>
          )}
        </div>
      </div>
    </div>
  );
}
