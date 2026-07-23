"use client";

import { useActionState, useEffect, useState } from "react";
import {
  fetchPortalUsersForClient,
  type GrantPortalAccessState,
  grantPortalAccessAction,
  revokePortalAccessAction,
  togglePortalUploadPermissionAction,
} from "@/application/clientPortal/portalAccessActions";
import type { PortalUserRow } from "@/repositories/clientPortal/portalAccessRepository";

const INITIAL_STATE: GrantPortalAccessState = { status: "idle" };

/** Additive section appended to ClientDrawer.tsx — "Cliente recebe acesso",
 * the first step of the Fase 13 flow, lives here since granting/revoking a
 * portal login is scoped to one client, exactly like ClientProjectsSection
 * (Fase 12) is scoped to one client's projects. */
export function ClientPortalAccessSection({
  clientId,
  clientCompany,
}: {
  clientId: string;
  clientCompany: string;
}) {
  const [users, setUsers] = useState<PortalUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function reload() {
    setLoading(true);
    setUsers(await fetchPortalUsersForClient(clientId));
    setLoading(false);
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: reload is intentionally not memoized — only clientId should re-trigger this.
  useEffect(() => {
    reload();
  }, [clientId]);

  const [state, formAction, pending] = useActionState(
    async (prev: GrantPortalAccessState, fd: FormData) => {
      const result = await grantPortalAccessAction(prev, fd);
      if (result.status === "success") await reload();
      return result;
    },
    INITIAL_STATE,
  );

  async function handleToggle(userId: string, current: boolean) {
    const result = await togglePortalUploadPermissionAction(userId, !current);
    if (result.error) window.alert(result.error);
    await reload();
  }

  async function handleRevoke(userId: string, profileId: string, email: string | null) {
    if (!window.confirm(`Revogar o acesso ao portal de "${email ?? "este contato"}"?`)) return;
    const result = await revokePortalAccessAction(userId, profileId);
    if (result.error) window.alert(result.error);
    await reload();
  }

  return (
    <div className="crm-drawer-section">
      <div className="crm-card-head">
        <div className="crm-drawer-section-title" style={{ marginBottom: 0 }}>
          Portal do Cliente
        </div>
        <button type="button" className="btn btn-outline" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancelar" : "Conceder acesso"}
        </button>
      </div>

      {showForm && (
        <form action={formAction} className="crm-composer" style={{ marginBottom: 16 }}>
          <input type="hidden" name="clientId" value={clientId} />
          <div className="crm-field" style={{ marginBottom: 10 }}>
            <label htmlFor="portal-access-name">Nome do contato</label>
            <input id="portal-access-name" name="name" placeholder={clientCompany} />
          </div>
          <div className="crm-field" style={{ marginBottom: 10 }}>
            <label htmlFor="portal-access-email">E-mail</label>
            <input id="portal-access-email" name="email" type="email" required />
          </div>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 10,
              fontSize: 13,
            }}
          >
            <input type="checkbox" name="canUploadFiles" />
            Permitir envio de arquivos pelo cliente
          </label>
          {state.status === "error" && <div className="crm-field-error">{state.message}</div>}
          {state.status === "success" && state.temporaryPassword && (
            <div
              className="crm-field-error"
              style={{ color: "var(--accent)", background: "transparent" }}
            >
              {state.message}
              <br />
              <strong>Senha temporária: {state.temporaryPassword}</strong>
            </div>
          )}
          <button type="submit" className="btn btn-accent" disabled={pending}>
            {pending ? "Criando…" : "Criar acesso"}
          </button>
        </form>
      )}

      {loading && <p className="crm-card-sub">Carregando…</p>}
      {!loading && users.length === 0 && (
        <p className="crm-card-sub">Nenhum acesso ao portal concedido ainda.</p>
      )}
      {!loading &&
        users.map((user) => (
          <div key={user.id} className="crm-pj-task-row">
            <div>
              <strong>{user.name || user.email || "Contato"}</strong>
              <div className="crm-pj-desc">{user.email}</div>
            </div>
            <div className="crm-pj-row-actions">
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                <input
                  type="checkbox"
                  checked={user.canUploadFiles}
                  onChange={() => handleToggle(user.id, user.canUploadFiles)}
                />
                Enviar arquivos
              </label>
              <button
                type="button"
                className="crm-pj-action-btn danger"
                onClick={() => handleRevoke(user.id, user.profileId, user.email)}
              >
                Revogar
              </button>
            </div>
          </div>
        ))}
    </div>
  );
}
