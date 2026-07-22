"use client";

import { useActionState } from "react";
import { type ActionState, updateLeadAction } from "@/application/crm/leadsActions";
import type { CrmLeadWithRelations } from "@/types/crm";

const INITIAL_STATE: ActionState = { status: "idle" };

export function EditLeadModal({
  lead,
  owners,
  onClose,
  onSaved,
}: {
  lead: CrmLeadWithRelations;
  owners: { id: string; name: string | null; email: string | null }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [state, formAction, pending] = useActionState(async (prev: ActionState, fd: FormData) => {
    const result = await updateLeadAction(prev, fd);
    if (result.status === "success") onSaved();
    return result;
  }, INITIAL_STATE);

  return (
    <>
      <button type="button" aria-label="Fechar" className="crm-modal-overlay" onClick={onClose} />
      <div className="crm-modal-center">
        <div
          className="crm-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Editar lead"
          style={{ maxWidth: 560 }}
        >
          <div className="crm-modal-head">
            <span className="crm-modal-title">Editar lead</span>
          </div>
          <form action={formAction} className="crm-modal-form">
            <input type="hidden" name="leadId" value={lead.id} />
            <div className="crm-ws-composer-row">
              <div className="crm-field">
                <label htmlFor="edit-name">Nome</label>
                <input id="edit-name" name="name" defaultValue={lead.name} required />
              </div>
              <div className="crm-field">
                <label htmlFor="edit-company">Empresa</label>
                <input id="edit-company" name="company" defaultValue={lead.company ?? ""} />
              </div>
            </div>
            <div className="crm-ws-composer-row">
              <div className="crm-field">
                <label htmlFor="edit-jobtitle">Cargo</label>
                <input id="edit-jobtitle" name="jobTitle" defaultValue={lead.jobTitle ?? ""} />
              </div>
              <div className="crm-field">
                <label htmlFor="edit-city">Cidade</label>
                <input id="edit-city" name="city" defaultValue={lead.city ?? ""} />
              </div>
            </div>
            <div className="crm-ws-composer-row">
              <div className="crm-field">
                <label htmlFor="edit-email">E-mail</label>
                <input id="edit-email" name="email" type="email" defaultValue={lead.email ?? ""} />
              </div>
              <div className="crm-field">
                <label htmlFor="edit-phone">Telefone</label>
                <input id="edit-phone" name="phone" defaultValue={lead.phone ?? ""} />
              </div>
            </div>
            <div className="crm-ws-composer-row">
              <div className="crm-field">
                <label htmlFor="edit-origin">Origem</label>
                <input id="edit-origin" name="origin" defaultValue={lead.origin ?? ""} />
              </div>
              <div className="crm-field">
                <label htmlFor="edit-owner">Responsável</label>
                <select id="edit-owner" name="ownerId" defaultValue={lead.ownerId ?? ""}>
                  <option value="">Sem responsável</option>
                  {owners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.name || owner.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="crm-field">
              <label htmlFor="edit-value">Valor potencial (R$)</label>
              <input
                id="edit-value"
                name="potentialValue"
                type="number"
                step="0.01"
                min="0"
                defaultValue={lead.potentialValue ?? ""}
              />
            </div>
            <div className="crm-field">
              <label htmlFor="edit-tags">Tags (separadas por vírgula)</label>
              <input id="edit-tags" name="tags" defaultValue={lead.tags.join(", ")} />
            </div>
            <p className="crm-card-sub" style={{ margin: 0 }}>
              Score calculado automaticamente ({lead.score}/100) — não é editável manualmente.
            </p>
            {state.status === "error" && <div className="crm-field-error">{state.message}</div>}
            <div className="crm-modal-actions">
              <button type="button" className="btn btn-outline" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-accent" disabled={pending}>
                {pending ? "Salvando…" : "Salvar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
