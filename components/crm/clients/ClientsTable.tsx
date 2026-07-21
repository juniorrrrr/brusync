"use client";

import { useClientDrawer } from "@/contexts/crm/ClientDrawerContext";
import { CLIENT_STATUS_BADGE, CLIENT_STATUS_LABEL } from "@/domain/crm/clientRules";
import { formatDate, initials } from "@/domain/crm/format";
import type { ClientWithOwner } from "@/types/crm";

export function ClientsTable({ clients }: { clients: ClientWithOwner[] }) {
  const { openClient } = useClientDrawer();

  return (
    <div className="crm-table-wrap">
      <table className="crm-table">
        <thead>
          <tr>
            <th>Empresa</th>
            <th>Contato principal</th>
            <th>Responsável</th>
            <th>Status</th>
            <th>Cliente desde</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr key={client.id}>
              <td>
                <button
                  type="button"
                  className="cell-strong"
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                  onClick={() => openClient(client.id)}
                >
                  <span className="crm-avatar" style={{ width: 26, height: 26, fontSize: 10 }}>
                    {initials(client.company)}
                  </span>
                  {client.company}
                </button>
              </td>
              <td className="cell-muted">{client.name || "—"}</td>
              <td className="cell-muted">{client.owner?.name || client.owner?.email || "—"}</td>
              <td>
                <span className={`crm-badge ${CLIENT_STATUS_BADGE[client.status]}`}>
                  {CLIENT_STATUS_LABEL[client.status]}
                </span>
              </td>
              <td className="cell-muted">{formatDate(client.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
