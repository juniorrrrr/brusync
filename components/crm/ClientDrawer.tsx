"use client";

import { useActionState, useState } from "react";
import { updateClientAction } from "@/application/crm/clientsActions";
import type { ActionState } from "@/application/crm/leadsActions";
import { IconX } from "@/components/ui/icons";
import { useClientDrawer } from "@/contexts/crm/ClientDrawerContext";
import { CLIENT_STATUS_BADGE, CLIENT_STATUS_LABEL } from "@/domain/crm/clientRules";
import { formatDateTime, initials } from "@/domain/crm/format";
import type { ClientStatus } from "@/types/crm";

const INITIAL_STATE: ActionState = { status: "idle" };
const STATUS_OPTIONS: ClientStatus[] = ["ativo", "inativo", "em_risco"];

export function ClientDrawer() {
  const { clientId, data, loading, error, close, refresh } = useClientDrawer();
  const [editing, setEditing] = useState(false);
  const open = clientId !== null;

  const [state, formAction, pending] = useActionState(async (prev: ActionState, fd: FormData) => {
    const result = await updateClientAction(prev, fd);
    if (result.status === "success") {
      setEditing(false);
      refresh();
    }
    return result;
  }, INITIAL_STATE);

  return (
    <>
      <button
        type="button"
        aria-label="Fechar"
        className={`crm-drawer-overlay${open ? " open" : ""}`}
        onClick={close}
      />
      <aside className={`crm-drawer${open ? " open" : ""}`} aria-hidden={!open}>
        {loading && <div className="crm-drawer-loading">Carregando cliente…</div>}
        {!loading && error && <div className="crm-drawer-empty">{error}</div>}
        {!loading && data && (
          <>
            <div className="crm-drawer-head">
              <div className="crm-lead-head" style={{ marginBottom: 0 }}>
                <div className="crm-lead-avatar">{initials(data.client.company)}</div>
                <div>
                  <div className="crm-lead-name">{data.client.company}</div>
                  <div className="crm-lead-company">
                    {data.client.name || "Sem contato principal"}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="crm-drawer-close"
                onClick={() => {
                  setEditing(false);
                  close();
                }}
              >
                <IconX size={16} />
              </button>
            </div>

            <div className="crm-drawer-body">
              {editing ? (
                <form
                  action={formAction}
                  className="crm-drawer-section"
                  style={{ marginTop: 0, paddingTop: 0, borderTop: "none" }}
                >
                  <input type="hidden" name="clientId" value={data.client.id} />
                  <div className="crm-field" style={{ marginBottom: 12 }}>
                    <label htmlFor="client-company">Empresa</label>
                    <input
                      id="client-company"
                      name="company"
                      defaultValue={data.client.company}
                      required
                    />
                  </div>
                  <div className="crm-field" style={{ marginBottom: 12 }}>
                    <label htmlFor="client-name">Contato principal</label>
                    <input id="client-name" name="name" defaultValue={data.client.name ?? ""} />
                  </div>
                  <div className="crm-field" style={{ marginBottom: 12 }}>
                    <label htmlFor="client-email">E-mail</label>
                    <input
                      id="client-email"
                      name="email"
                      type="email"
                      defaultValue={data.client.email ?? ""}
                    />
                  </div>
                  <div className="crm-field" style={{ marginBottom: 12 }}>
                    <label htmlFor="client-phone">Telefone</label>
                    <input id="client-phone" name="phone" defaultValue={data.client.phone ?? ""} />
                  </div>
                  <div className="crm-field" style={{ marginBottom: 12 }}>
                    <label htmlFor="client-owner">Responsável</label>
                    <select
                      id="client-owner"
                      name="ownerId"
                      defaultValue={data.client.ownerId ?? ""}
                    >
                      <option value="">Sem responsável</option>
                      {data.owners.map((owner) => (
                        <option key={owner.id} value={owner.id}>
                          {owner.name || owner.email}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="crm-field" style={{ marginBottom: 16 }}>
                    <label htmlFor="client-status">Status</label>
                    <select id="client-status" name="status" defaultValue={data.client.status}>
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {CLIENT_STATUS_LABEL[status]}
                        </option>
                      ))}
                    </select>
                  </div>
                  {state.status === "error" && (
                    <div className="crm-field-error">{state.message}</div>
                  )}
                  <div style={{ display: "flex", gap: 10 }}>
                    <button type="submit" className="btn btn-accent" disabled={pending}>
                      {pending ? "Salvando…" : "Salvar"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => setEditing(false)}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <div
                  className="crm-drawer-section"
                  style={{ marginTop: 0, paddingTop: 0, borderTop: "none" }}
                >
                  <div className="crm-card-head">
                    <div className="crm-drawer-section-title" style={{ marginBottom: 0 }}>
                      Informações
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => setEditing(true)}
                    >
                      Editar
                    </button>
                  </div>
                  <div className="crm-info-list">
                    <div className="crm-info-row">
                      <span className="crm-info-row-label">Status</span>
                      <span className="crm-info-row-value">
                        <span className={`crm-badge ${CLIENT_STATUS_BADGE[data.client.status]}`}>
                          {CLIENT_STATUS_LABEL[data.client.status]}
                        </span>
                      </span>
                    </div>
                    <div className="crm-info-row">
                      <span className="crm-info-row-label">Contato principal</span>
                      <span className="crm-info-row-value">{data.client.name || "—"}</span>
                    </div>
                    <div className="crm-info-row">
                      <span className="crm-info-row-label">E-mail</span>
                      <span className="crm-info-row-value">{data.client.email || "—"}</span>
                    </div>
                    <div className="crm-info-row">
                      <span className="crm-info-row-label">Telefone</span>
                      <span className="crm-info-row-value">{data.client.phone || "—"}</span>
                    </div>
                    <div className="crm-info-row">
                      <span className="crm-info-row-label">Responsável</span>
                      <span className="crm-info-row-value">
                        {data.client.owner?.name || data.client.owner?.email || "Sem responsável"}
                      </span>
                    </div>
                    <div className="crm-info-row">
                      <span className="crm-info-row-label">Cliente desde</span>
                      <span className="crm-info-row-value">
                        {formatDateTime(data.client.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </aside>
    </>
  );
}
