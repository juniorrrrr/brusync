"use client";

import { useEffect, useState } from "react";
import { IconArchive, IconStar } from "@/components/ui/icons";
import { CONVERSATION_STATUS_LABEL } from "@/domain/whatsapp/statusMeta";
import { useUpdateSearchParams } from "@/hooks/crm/useUpdateSearchParams";
import type { WhatsappConversationStatus } from "@/types/whatsapp";

const STATUSES: WhatsappConversationStatus[] = ["aberta", "pendente", "encerrada"];

/** Mesmo padrão visual de components/communication/ConversationFilterBar.tsx
 * (Fase 15) — filtros via query string (useUpdateSearchParams), a página
 * (Server Component) re-busca com os novos filtros. */
export function WhatsappFilterBar({
  owners,
}: {
  owners: { id: string; name: string | null; email: string | null }[];
}) {
  const { update, searchParams } = useUpdateSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");

  // biome-ignore lint/correctness/useExhaustiveDependencies: update is stable; only search should re-trigger the debounce.
  useEffect(() => {
    const timeout = setTimeout(() => update({ q: search || null }), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const unread = searchParams.get("unread") === "1";
  const favorite = searchParams.get("favorite") === "1";
  const archived = searchParams.get("archived") === "1";

  return (
    <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
      <input
        type="text"
        className="crm-select"
        placeholder="Buscar conversa…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Buscar conversa"
        style={{ width: "100%" }}
      />

      <div style={{ display: "flex", gap: 6 }}>
        <button
          type="button"
          className={`btn ${unread ? "btn-accent" : "btn-outline"}`}
          style={{ flex: 1, padding: "6px 8px", fontSize: 12 }}
          onClick={() => update({ unread: unread ? null : "1" })}
        >
          Não lidas
        </button>
        <button
          type="button"
          className={`btn ${favorite ? "btn-accent" : "btn-outline"}`}
          style={{ flex: 1, padding: "6px 8px", fontSize: 12 }}
          onClick={() => update({ favorite: favorite ? null : "1" })}
          aria-label="Favoritas"
        >
          <IconStar size={13} />
        </button>
        <button
          type="button"
          className={`btn ${archived ? "btn-accent" : "btn-outline"}`}
          style={{ flex: 1, padding: "6px 8px", fontSize: 12 }}
          onClick={() => update({ archived: archived ? null : "1" })}
          aria-label="Arquivadas"
        >
          <IconArchive size={13} />
        </button>
      </div>

      <select
        className="crm-select"
        value={searchParams.get("ownerId") ?? ""}
        onChange={(e) => update({ ownerId: e.target.value || null })}
        aria-label="Responsável"
      >
        <option value="">Todos os responsáveis</option>
        {owners.map((owner) => (
          <option key={owner.id} value={owner.id}>
            {owner.name ?? owner.email}
          </option>
        ))}
      </select>

      <select
        className="crm-select"
        value={searchParams.get("status") ?? ""}
        onChange={(e) => update({ status: e.target.value || null })}
        aria-label="Status"
      >
        <option value="">Todos os status</option>
        {STATUSES.map((status) => (
          <option key={status} value={status}>
            {CONVERSATION_STATUS_LABEL[status]}
          </option>
        ))}
      </select>
    </div>
  );
}
