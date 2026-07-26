"use client";

import { IconStar } from "@/components/ui/icons";
import { formatRelativeToNow, initials } from "@/domain/crm/format";
import { CONVERSATION_STATUS_BADGE, CONVERSATION_STATUS_LABEL } from "@/domain/whatsapp/statusMeta";
import type { WhatsappConversation } from "@/types/whatsapp";

/** Mesmo padrão visual de components/communication/ConversationListRow.tsx
 * (Fase 15) — reaproveita as classes crm-comm-* tal qual, "exatamente o
 * padrão visual do Brusync" pedido pela Fase 28. */
export function WhatsappConversationListRow({
  conversation,
  active,
  onSelect,
}: {
  conversation: WhatsappConversation;
  active: boolean;
  onSelect: () => void;
}) {
  const title =
    conversation.crmLeadName ??
    conversation.clientCompany ??
    conversation.contact.profileName ??
    conversation.contact.phoneNumber;

  return (
    <button type="button" className={`crm-comm-row${active ? " active" : ""}`} onClick={onSelect}>
      <span className="crm-avatar" style={{ width: 34, height: 34, fontSize: 12, flexShrink: 0 }}>
        {initials(title)}
      </span>
      <div className="crm-comm-row-body">
        <div className="crm-comm-row-top">
          <span className="crm-comm-row-name">
            {conversation.isFavorite && (
              <span className="crm-comm-star">
                <IconStar size={12} />
              </span>
            )}{" "}
            {title}
          </span>
          {conversation.lastMessageAt && (
            <span className="crm-comm-row-time">
              {formatRelativeToNow(conversation.lastMessageAt)}
            </span>
          )}
        </div>
        <div className="crm-comm-row-preview">
          {conversation.lastMessageDirection === "outbound" ? "Você: " : ""}
          {conversation.lastMessagePreview ?? "Sem mensagens ainda"}
        </div>
        <div className="crm-comm-row-meta">
          <span className={`crm-badge ${CONVERSATION_STATUS_BADGE[conversation.status]}`}>
            {CONVERSATION_STATUS_LABEL[conversation.status]}
          </span>
          {conversation.labels.map((label) => (
            <span key={label.id} className="crm-badge neutral" style={{ color: label.color }}>
              {label.name}
            </span>
          ))}
          {conversation.unreadCount > 0 && (
            <span className="crm-comm-unread-badge">{conversation.unreadCount}</span>
          )}
        </div>
      </div>
    </button>
  );
}
