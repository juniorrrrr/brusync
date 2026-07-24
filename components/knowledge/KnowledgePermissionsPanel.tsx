"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  fetchKnowledgePermissionsForTarget,
  grantKnowledgePermissionAction,
  revokeKnowledgePermissionAction,
} from "@/application/knowledge/knowledgePermissionsActions";
import type { KnowledgePermission } from "@/types/knowledge";

const ROLES = ["administrador", "gestor", "comercial", "atendimento"] as const;
const ACTIONS: { key: keyof KnowledgePermission; label: string }[] = [
  { key: "canView", label: "Visualizar" },
  { key: "canEdit", label: "Editar" },
  { key: "canDelete", label: "Excluir" },
  { key: "canPublish", label: "Publicar" },
  { key: "canApprove", label: "Aprovar" },
  { key: "canDuplicate", label: "Duplicar" },
  { key: "canFavorite", label: "Favoritar" },
];

export function KnowledgePermissionsPanel({ documentId }: { documentId: string }) {
  const [permissions, setPermissions] = useState<KnowledgePermission[]>([]);
  const [role, setRole] = useState<(typeof ROLES)[number]>("comercial");
  const [flags, setFlags] = useState<Record<string, boolean>>({
    canView: true,
    canEdit: false,
    canDelete: false,
    canPublish: false,
    canApprove: false,
    canDuplicate: true,
    canFavorite: true,
  });
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    fetchKnowledgePermissionsForTarget({ documentId }).then(setPermissions);
  }, [documentId]);

  useEffect(() => {
    reload();
  }, [reload]);

  function handleGrant() {
    startTransition(async () => {
      const result = await grantKnowledgePermissionAction({
        documentId,
        categoryId: null,
        profileId: null,
        role,
        canView: flags.canView,
        canEdit: flags.canEdit,
        canDelete: flags.canDelete,
        canPublish: flags.canPublish,
        canApprove: flags.canApprove,
        canDuplicate: flags.canDuplicate,
        canFavorite: flags.canFavorite,
      });
      if (!result.ok) {
        setError(result.error ?? "Falha ao conceder permissão.");
        return;
      }
      reload();
    });
  }

  function handleRevoke(id: string) {
    startTransition(async () => {
      await revokeKnowledgePermissionAction(id);
      reload();
    });
  }

  return (
    <div>
      {permissions.length === 0 ? (
        <p className="crm-card-sub" style={{ marginBottom: 12 }}>
          Nenhuma permissão específica configurada — segue o padrão por papel.
        </p>
      ) : (
        <div style={{ marginBottom: 14 }}>
          {permissions.map((permission) => (
            <div key={permission.id} className="crm-kb-version-row">
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>
                  {permission.profileName ?? permission.role ?? "—"}
                </div>
                <div className="crm-card-sub" style={{ margin: 0 }}>
                  {ACTIONS.filter((a) => permission[a.key])
                    .map((a) => a.label)
                    .join(", ") || "Sem permissões"}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => handleRevoke(permission.id)}
                disabled={isPending}
              >
                Revogar
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="crm-composer-row">
        <div className="crm-field">
          <label htmlFor="perm-role">Papel</label>
          <select
            id="perm-role"
            value={role}
            onChange={(e) => setRole(e.target.value as (typeof ROLES)[number])}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "10px 0" }}>
        {ACTIONS.map((action) => (
          <label
            key={action.key}
            style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 13 }}
          >
            <input
              type="checkbox"
              checked={flags[action.key] ?? false}
              onChange={(e) => setFlags({ ...flags, [action.key]: e.target.checked })}
            />
            {action.label}
          </label>
        ))}
      </div>

      {error && (
        <div className="crm-field-error" style={{ marginBottom: 10 }}>
          {error}
        </div>
      )}

      <button type="button" className="btn btn-accent" onClick={handleGrant} disabled={isPending}>
        Conceder permissão
      </button>
    </div>
  );
}
