"use client";

import { IconStar } from "@/components/ui/icons";
import {
  CHANNEL_TYPE_ICON,
  CONVERSATION_STATUS_LABEL,
  conversationStatusBadge,
  isConversationStale,
} from "@/domain/communication/types";
import { formatRelativeToNow, initials } from "@/domain/crm/format";
import type { Conversation } from "@/types/communication";

export function ConversationListRow({
  conversation,
  active,
  onSelect,
}: {
  conversation: Conversation;
  active: boolean;
  onSelect: () => void;
}) {
  const title =
    conversation.crmLeadName ??
    conversation.clientCompany ??
    conversation.contactName ??
    "Sem nome";
  const ChannelIcon = CHANNEL_TYPE_ICON[conversation.channelType];
  const stale = isConversationStale(conversation.lastMessageAt);

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
            <span className={`crm-comm-row-time${stale ? " stale" : ""}`}>
              {formatRelativeToNow(conversation.lastMessageAt)}
            </span>
          )}
        </div>
        <div className="crm-comm-row-preview">
          {conversation.lastMessageDirection === "outbound" ? "Você: " : ""}
          {conversation.lastMessagePreview ?? "Sem mensagens ainda"}
        </div>
        <div className="crm-comm-row-meta">
          <span
            className="crm-badge neutral"
            style={{ display: "inline-flex", gap: 4, alignItems: "center" }}
          >
            <ChannelIcon size={11} /> {conversation.channelName}
          </span>
          <span className={`crm-badge ${conversationStatusBadge(conversation.status)}`}>
            {CONVERSATION_STATUS_LABEL[conversation.status]}
          </span>
          {conversation.unreadCount > 0 && (
            <span className="crm-comm-unread-badge">{conversation.unreadCount}</span>
          )}
        </div>
      </div>
    </button>
  );
}
