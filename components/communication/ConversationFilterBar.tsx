"use client";

import { useEffect, useState } from "react";
import { IconArchive, IconStar } from "@/components/ui/icons";
import {
  CHANNEL_TYPE_LABEL,
  CONVERSATION_STATUS_LABEL,
  CONVERSATION_STATUSES,
} from "@/domain/communication/types";
import { useUpdateSearchParams } from "@/hooks/crm/useUpdateSearchParams";
import type { Channel } from "@/types/communication";
import type { OwnerRef } from "@/types/crm";

export function ConversationFilterBar({
  channels,
  owners,
}: {
  channels: Channel[];
  owners: OwnerRef[];
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
        value={searchParams.get("channelId") ?? ""}
        onChange={(e) => update({ channelId: e.target.value || null })}
        aria-label="Canal"
      >
        <option value="">Todos os canais</option>
        {channels.map((channel) => (
          <option key={channel.id} value={channel.id}>
            {channel.name || CHANNEL_TYPE_LABEL[channel.type]}
          </option>
        ))}
      </select>

      <select
        className="crm-select"
        value={searchParams.get("ownerId") ?? ""}
        onChange={(e) => update({ ownerId: e.target.value || null })}
        aria-label="Responsável"
      >
        <option value="">Todos os responsáveis</option>
        {owners.map((owner) => (
          <option key={owner.id} value={owner.id}>
            {owner.name || owner.email}
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
        {CONVERSATION_STATUSES.map((status) => (
          <option key={status} value={status}>
            {CONVERSATION_STATUS_LABEL[status]}
          </option>
        ))}
      </select>

      <details>
        <summary style={{ fontSize: 12, color: "var(--muted)", cursor: "pointer" }}>
          Mais filtros
        </summary>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
          <input
            type="text"
            className="crm-select"
            placeholder="Origem"
            defaultValue={searchParams.get("origin") ?? ""}
            onBlur={(e) => update({ origin: e.target.value || null })}
          />
          <input
            type="text"
            className="crm-select"
            placeholder="Campanha"
            defaultValue={searchParams.get("campaign") ?? ""}
            onBlur={(e) => update({ campaign: e.target.value || null })}
          />
          <input
            type="text"
            className="crm-select"
            placeholder="Cidade"
            defaultValue={searchParams.get("city") ?? ""}
            onBlur={(e) => update({ city: e.target.value || null })}
          />
        </div>
      </details>
    </div>
  );
}
