"use client";

import { useActionState, useState } from "react";
import { type ActionState, updateLeadAction } from "@/application/crm/leadsActions";
import { formatCurrencyBRL, formatDateTime } from "@/domain/crm/format";
import type { CrmLeadWithRelations } from "@/types/crm";

const INITIAL_STATE: ActionState = { status: "idle" };

export function LeadDrawerSummary({
  lead,
  owners,
  onSaved,
}: {
  lead: CrmLeadWithRelations;
  owners: { id: string; name: string | null; email: string | null }[];
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(async (prev: ActionState, fd: FormData) => {
    const result = await updateLeadAction(prev, fd);
    if (result.status === "success") {
      setEditing(false);
      onSaved();
    }
    return result;
  }, INITIAL_STATE);

  if (editing) {
    return (
      <form
        action={formAction}
        className="crm-drawer-section"
        style={{ marginTop: 0, paddingTop: 0, borderTop: "none" }}
      >
        <input type="hidden" name="leadId" value={lead.id} />
        <div className="crm-field" style={{ marginBottom: 12 }}>
          <label htmlFor="edit-company">Empresa</label>
          <input id="edit-company" name="company" defaultValue={lead.company ?? ""} />
        </div>
        <div className="crm-field" style={{ marginBottom: 12 }}>
          <label htmlFor="edit-email">E-mail</label>
          <input id="edit-email" name="email" type="email" defaultValue={lead.email ?? ""} />
        </div>
        <div className="crm-field" style={{ marginBottom: 12 }}>
          <label htmlFor="edit-phone">Telefone</label>
          <input id="edit-phone" name="phone" defaultValue={lead.phone ?? ""} />
        </div>
        <div className="crm-field" style={{ marginBottom: 12 }}>
          <label htmlFor="edit-origin">Origem</label>
          <input id="edit-origin" name="origin" defaultValue={lead.origin ?? ""} />
        </div>
        <div className="crm-field" style={{ marginBottom: 12 }}>
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
        <div className="crm-field" style={{ marginBottom: 12 }}>
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
        <div className="crm-field" style={{ marginBottom: 12 }}>
          <label htmlFor="edit-score">Score (0-100)</label>
          <input
            id="edit-score"
            name="score"
            type="number"
            min="0"
            max="100"
            defaultValue={lead.score}
          />
        </div>
        <div className="crm-field" style={{ marginBottom: 16 }}>
          <label htmlFor="edit-tags">Tags (separadas por vírgula)</label>
          <input id="edit-tags" name="tags" defaultValue={lead.tags.join(", ")} />
        </div>
        {state.status === "error" && <div className="crm-field-error">{state.message}</div>}
        <div style={{ display: "flex", gap: 10 }}>
          <button type="submit" className="btn btn-accent" disabled={pending}>
            {pending ? "Salvando…" : "Salvar"}
          </button>
          <button type="button" className="btn btn-outline" onClick={() => setEditing(false)}>
            Cancelar
          </button>
        </div>
      </form>
    );
  }

  return (
    <>
      <div
        className="crm-drawer-section"
        style={{ marginTop: 0, paddingTop: 0, borderTop: "none" }}
      >
        <div className="crm-card-head">
          <div className="crm-drawer-section-title" style={{ marginBottom: 0 }}>
            Informações
          </div>
          <button type="button" className="btn btn-outline" onClick={() => setEditing(true)}>
            Editar
          </button>
        </div>
        <div className="crm-info-list">
          <div className="crm-info-row">
            <span className="crm-info-row-label">Estágio</span>
            <span className="crm-info-row-value">
              <span className={`crm-badge ${lead.stage.color}`}>{lead.stage.label}</span>
            </span>
          </div>
          <div className="crm-info-row">
            <span className="crm-info-row-label">E-mail</span>
            <span className="crm-info-row-value">{lead.email || "—"}</span>
          </div>
          <div className="crm-info-row">
            <span className="crm-info-row-label">Telefone</span>
            <span className="crm-info-row-value">{lead.phone || "—"}</span>
          </div>
          <div className="crm-info-row">
            <span className="crm-info-row-label">Origem</span>
            <span className="crm-info-row-value">{lead.origin || "—"}</span>
          </div>
          <div className="crm-info-row">
            <span className="crm-info-row-label">Responsável</span>
            <span className="crm-info-row-value">
              {lead.owner?.name || lead.owner?.email || "Sem responsável"}
            </span>
          </div>
          <div className="crm-info-row">
            <span className="crm-info-row-label">Valor potencial</span>
            <span className="crm-info-row-value">{formatCurrencyBRL(lead.potentialValue)}</span>
          </div>
          <div className="crm-info-row">
            <span className="crm-info-row-label">Score</span>
            <span className="crm-info-row-value">{lead.score}</span>
          </div>
          <div className="crm-info-row">
            <span className="crm-info-row-label">Criado em</span>
            <span className="crm-info-row-value">{formatDateTime(lead.createdAt)}</span>
          </div>
          <div className="crm-info-row">
            <span className="crm-info-row-label">Última interação</span>
            <span className="crm-info-row-value">
              {lead.lastInteractionAt ? formatDateTime(lead.lastInteractionAt) : "Nenhuma ainda"}
            </span>
          </div>
        </div>
      </div>

      <div className="crm-drawer-section">
        <div className="crm-drawer-section-title">Tags</div>
        {lead.tags.length > 0 ? (
          <div className="crm-tags">
            {lead.tags.map((tag) => (
              <span key={tag} className="crm-tag">
                {tag}
              </span>
            ))}
          </div>
        ) : (
          <p className="crm-card-sub">Nenhuma tag adicionada.</p>
        )}
      </div>
    </>
  );
}
