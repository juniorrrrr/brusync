"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useConversationDialog } from "@/contexts/communication/ConversationDialogContext";
import {
  CHANNEL_TYPE_ICON,
  CONVERSATION_STATUS_LABEL,
  conversationStatusBadge,
} from "@/domain/communication/types";
import { formatRelativeToNow } from "@/domain/crm/format";
import { useClientConversations } from "@/hooks/communication/useClientConversations";

/** Additive section appended to ClientDrawer.tsx (mirrors
 * ClientFinancialSummarySection, Fase 14) — every conversation linked to
 * this client, with a shortcut into the full Central de Comunicação. */
export function ClientCommunicationSection({
  clientId,
  clientCompany,
}: {
  clientId: string;
  clientCompany: string;
}) {
  const { conversations, loading, reload } = useClientConversations(clientId);
  const { open, openCreate } = useConversationDialog();
  const wasOpenRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    if (wasOpenRef.current && !open) reload();
    wasOpenRef.current = open;
  }, [open, reload]);

  return (
    <div className="crm-drawer-section">
      <div className="crm-card-head">
        <div className="crm-drawer-section-title" style={{ marginBottom: 0 }}>
          Comunicação
        </div>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => openCreate({ clientId, clientCompany })}
        >
          Nova conversa
        </button>
      </div>

      {loading && <p className="crm-card-sub">Carregando…</p>}
      {!loading && conversations.length === 0 && (
        <p className="crm-card-sub">Nenhuma conversa registrada com este cliente ainda.</p>
      )}
      {!loading &&
        conversations.map((conversation) => {
          const ChannelIcon = CHANNEL_TYPE_ICON[conversation.channelType];
          return (
            <div key={conversation.id} className="crm-pj-row">
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <ChannelIcon size={13} /> {conversation.channelName}
                  <span className={`crm-badge ${conversationStatusBadge(conversation.status)}`}>
                    {CONVERSATION_STATUS_LABEL[conversation.status]}
                  </span>
                </div>
                <div className="crm-pj-desc">
                  {conversation.lastMessagePreview ?? "Sem mensagens ainda"}
                  {conversation.lastMessageAt &&
                    ` · ${formatRelativeToNow(conversation.lastMessageAt)}`}
                </div>
              </div>
              <div className="crm-pj-row-actions">
                <button
                  type="button"
                  className="crm-pj-action-btn"
                  onClick={() => router.push(`/comunicacao?conversationId=${conversation.id}`)}
                >
                  Abrir
                </button>
              </div>
            </div>
          );
        })}
    </div>
  );
}
