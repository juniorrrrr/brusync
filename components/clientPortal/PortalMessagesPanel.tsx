"use client";

import { useState } from "react";
import { usePortalMessages } from "@/contexts/clientPortal/PortalMessagesContext";
import { formatDateTime } from "@/domain/crm/format";

function MessageList() {
  const { messages } = usePortalMessages();

  if (messages.length === 0) {
    return <p className="crm-card-sub">Nenhuma mensagem ainda — envie a primeira abaixo.</p>;
  }

  return (
    <div style={{ marginBottom: 16 }}>
      {messages.map((message) => (
        <div
          key={message.id}
          className={`crm-pj-comment${message.authorType === "cliente" ? " is-client" : ""}`}
        >
          <div className="crm-pj-comment-meta">
            {message.authorName} · {formatDateTime(message.createdAt)}
          </div>
          {message.body}
        </div>
      ))}
    </div>
  );
}

function MessageComposer() {
  const { sending, error, send } = usePortalMessages();
  const [body, setBody] = useState("");

  async function handleSend() {
    if (!body.trim()) return;
    await send(body);
    setBody("");
  }

  return (
    <div>
      {error && (
        <div className="crm-field-error" style={{ marginBottom: 8 }}>
          {error}
        </div>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          className="crm-select"
          style={{ flex: 1 }}
          placeholder="Escreva uma mensagem para a equipe…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <button
          type="button"
          className="crm-pj-action-btn"
          onClick={handleSend}
          disabled={sending || !body.trim()}
        >
          Enviar
        </button>
      </div>
    </div>
  );
}

/** "Cliente poderá comentar" — the "Equipe poderá responder" half of this
 * happens in the internal CRM (ProjectPortalMessagesTab, same table), never
 * here; the portal only ever writes author_type="cliente" messages. */
export function PortalMessagesPanel() {
  return (
    <div>
      <MessageList />
      <MessageComposer />
    </div>
  );
}
