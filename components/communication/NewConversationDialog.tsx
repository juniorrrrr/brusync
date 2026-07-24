"use client";

import { useActionState, useState } from "react";
import {
  type ConversationActionState,
  createConversationAction,
} from "@/application/communication/conversationsActions";
import { LeadPicker } from "@/components/agenda/LeadPicker";
import { ClientPicker } from "@/components/projects/ClientPicker";
import { useConversationDialog } from "@/contexts/communication/ConversationDialogContext";
import { CHANNEL_TYPE_LABEL } from "@/domain/communication/types";
import type { Channel } from "@/types/communication";
import type { OwnerRef } from "@/types/crm";

const INITIAL_STATE: ConversationActionState = { status: "idle" };

export function NewConversationDialog({
  channels,
  owners,
  onCreated,
}: {
  channels: Channel[];
  owners: OwnerRef[];
  onCreated: (conversationId: string) => void;
}) {
  const { open, fixedCrmLeadId, fixedCrmLeadName, fixedClientId, fixedClientCompany, close } =
    useConversationDialog();
  const [subject, setSubject] = useState<"lead" | "client">(fixedClientId ? "client" : "lead");

  const [state, formAction] = useActionState(
    async (prev: ConversationActionState, fd: FormData) => {
      const result = await createConversationAction(prev, fd);
      if (result.status === "success" && result.conversationId) {
        onCreated(result.conversationId);
        close();
      }
      return result;
    },
    INITIAL_STATE,
  );

  if (!open) return null;

  const hasFixedSubject = Boolean(fixedCrmLeadId || fixedClientId);

  return (
    <>
      <button type="button" aria-label="Fechar" className="crm-modal-overlay" onClick={close} />
      <div className="crm-modal-center">
        <div
          className="crm-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Nova conversa"
          style={{ maxWidth: 520 }}
        >
          <div className="crm-modal-head">
            <span className="crm-modal-title">Nova conversa</span>
          </div>

          <form action={formAction} className="crm-modal-form" style={{ overflow: "visible" }}>
            <div className="crm-field">
              <label htmlFor="conv-channel">Canal *</label>
              <select id="conv-channel" name="channelId" required defaultValue="">
                <option value="">Selecione…</option>
                {channels.map((channel) => (
                  <option key={channel.id} value={channel.id}>
                    {channel.name || CHANNEL_TYPE_LABEL[channel.type]}
                  </option>
                ))}
              </select>
            </div>

            {hasFixedSubject ? (
              <>
                {fixedCrmLeadId && <input type="hidden" name="crmLeadId" value={fixedCrmLeadId} />}
                {fixedClientId && <input type="hidden" name="clientId" value={fixedClientId} />}
                <div className="crm-field">
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>
                    {fixedCrmLeadId ? "Lead" : "Cliente"}
                  </span>
                  <span>{fixedCrmLeadName ?? fixedClientCompany}</span>
                </div>
              </>
            ) : (
              <>
                <div className="crm-toolbar" style={{ padding: 0, marginBottom: 4 }}>
                  <button
                    type="button"
                    className={`btn ${subject === "lead" ? "btn-accent" : "btn-outline"}`}
                    onClick={() => setSubject("lead")}
                  >
                    Lead
                  </button>
                  <button
                    type="button"
                    className={`btn ${subject === "client" ? "btn-accent" : "btn-outline"}`}
                    onClick={() => setSubject("client")}
                  >
                    Cliente
                  </button>
                </div>
                {subject === "lead" ? (
                  <LeadPicker name="crmLeadId" />
                ) : (
                  <ClientPicker name="clientId" />
                )}
              </>
            )}

            <div className="crm-composer-row">
              <div className="crm-field">
                <label htmlFor="conv-contact-name">Nome do contato</label>
                <input id="conv-contact-name" name="contactName" />
              </div>
              <div className="crm-field">
                <label htmlFor="conv-contact-handle">Telefone / usuário</label>
                <input id="conv-contact-handle" name="contactHandle" />
              </div>
            </div>

            <div className="crm-field">
              <label htmlFor="conv-owner">Responsável</label>
              <select id="conv-owner" name="ownerId" defaultValue="">
                <option value="">Eu mesmo</option>
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name || owner.email}
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
                Criar conversa
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
