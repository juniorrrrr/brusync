"use client";

import { useActionState, useEffect, useState } from "react";
import {
  fetchProjectMessagesForStaff,
  type PortalMessageActionState,
  sendStaffMessageAction,
} from "@/application/clientPortal/portalMessagesActions";
import { formatDateTime } from "@/domain/crm/format";
import type { PortalMessage } from "@/types/clientPortal";

const INITIAL_STATE: PortalMessageActionState = { status: "idle" };

/** Staff-side mirror of the portal's own Comentários tab, added to the
 * internal ProjectDrawer (Fase 12) — same crm_client_portal_messages table,
 * "Equipe poderá responder" half of the Fase 13 flow. */
export function ProjectPortalMessagesTab({ projectId }: { projectId: string }) {
  const [messages, setMessages] = useState<PortalMessage[]>([]);
  const [loading, setLoading] = useState(true);

  async function reload() {
    setLoading(true);
    setMessages(await fetchProjectMessagesForStaff(projectId));
    setLoading(false);
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: reload is intentionally not memoized — only projectId should re-trigger this.
  useEffect(() => {
    reload();
  }, [projectId]);

  const [state, formAction, pending] = useActionState(
    async (prev: PortalMessageActionState, fd: FormData) => {
      const result = await sendStaffMessageAction(prev, fd);
      if (result.status === "success") await reload();
      return result;
    },
    INITIAL_STATE,
  );

  if (loading) return <p className="crm-card-sub">Carregando…</p>;

  return (
    <div>
      {messages.length === 0 && <p className="crm-card-sub">Nenhuma mensagem do cliente ainda.</p>}
      {messages.map((message) => (
        <div key={message.id} className="crm-pj-comment">
          <div className="crm-pj-comment-meta">
            {message.authorName} ({message.authorType === "cliente" ? "Cliente" : "Equipe"}) ·{" "}
            {formatDateTime(message.createdAt)}
          </div>
          {message.body}
        </div>
      ))}

      <form action={formAction} style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input type="hidden" name="projectId" value={projectId} />
        <input
          className="crm-select"
          style={{ flex: 1 }}
          name="body"
          placeholder="Responder ao cliente…"
        />
        {state.status === "error" && <div className="crm-field-error">{state.message}</div>}
        <button type="submit" className="crm-pj-action-btn" disabled={pending}>
          Responder
        </button>
      </form>
    </div>
  );
}
