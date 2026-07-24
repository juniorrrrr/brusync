"use client";

import {
  changeConversationOwnerAction,
  setConversationStatusAction,
  toggleConversationArchiveAction,
  toggleConversationFavoriteAction,
} from "@/application/communication/conversationsActions";
import { MessageComposer } from "@/components/communication/MessageComposer";
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { IconArchive, IconStar } from "@/components/ui/icons";
import {
  CHANNEL_TYPE_ICON,
  CONVERSATION_STATUS_LABEL,
  conversationStatusBadge,
} from "@/domain/communication/types";
import { formatDateTime } from "@/domain/crm/format";
import type { ConversationDetail, MessageTemplate } from "@/types/communication";
import type { OwnerRef } from "@/types/crm";

export function ConversationThread({
  conversation,
  owners,
  templates,
  onChanged,
}: {
  conversation: ConversationDetail | null;
  owners: OwnerRef[];
  templates: MessageTemplate[];
  onChanged: () => void;
}) {
  if (!conversation) {
    return (
      <div className="crm-comm-pane">
        <div className="crm-comm-empty">
          <Empty>
            <EmptyMedia variant="icon">💬</EmptyMedia>
            <EmptyTitle>Selecione uma conversa</EmptyTitle>
            <EmptyDescription>
              Escolha uma conversa na lista ao lado para ver o histórico completo.
            </EmptyDescription>
          </Empty>
        </div>
      </div>
    );
  }

  const activeConversation = conversation;
  const title =
    activeConversation.crmLeadName ??
    activeConversation.clientCompany ??
    activeConversation.contactName ??
    "Sem nome";
  const ChannelIcon = CHANNEL_TYPE_ICON[activeConversation.channelType];

  async function handleStatusChange(status: "aberta" | "pendente" | "encerrada") {
    await setConversationStatusAction(activeConversation.id, status);
    onChanged();
  }

  async function handleFavorite() {
    await toggleConversationFavoriteAction(activeConversation.id, !activeConversation.isFavorite);
    onChanged();
  }

  async function handleArchive() {
    await toggleConversationArchiveAction(activeConversation.id, !activeConversation.isArchived);
    onChanged();
  }

  async function handleOwnerChange(ownerId: string) {
    await changeConversationOwnerAction(activeConversation.id, ownerId || null);
    onChanged();
  }

  return (
    <div className="crm-comm-pane">
      <div className="crm-comm-pane-head crm-comm-thread-head">
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{title}</div>
          <div
            style={{
              display: "flex",
              gap: 6,
              alignItems: "center",
              marginTop: 4,
              fontSize: 12,
              color: "var(--muted)",
            }}
          >
            <ChannelIcon size={12} /> {conversation.channelName}
            <span className={`crm-badge ${conversationStatusBadge(conversation.status)}`}>
              {CONVERSATION_STATUS_LABEL[conversation.status]}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <select
            className="crm-select"
            value={conversation.ownerId ?? ""}
            onChange={(e) => handleOwnerChange(e.target.value)}
            aria-label="Responsável"
            style={{ fontSize: 12 }}
          >
            <option value="">Sem responsável</option>
            {owners.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.name || owner.email}
              </option>
            ))}
          </select>

          <button
            type="button"
            className={`btn ${conversation.isFavorite ? "btn-accent" : "btn-outline"}`}
            style={{ padding: "6px 8px" }}
            onClick={handleFavorite}
            aria-label="Favoritar"
          >
            <IconStar size={13} />
          </button>
          <button
            type="button"
            className={`btn ${conversation.isArchived ? "btn-accent" : "btn-outline"}`}
            style={{ padding: "6px 8px" }}
            onClick={handleArchive}
            aria-label="Arquivar"
          >
            <IconArchive size={13} />
          </button>

          {conversation.status === "encerrada" ? (
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => handleStatusChange("aberta")}
            >
              Reabrir
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => handleStatusChange("encerrada")}
            >
              Encerrar
            </button>
          )}
        </div>
      </div>

      <div className="crm-comm-thread-scroll">
        {conversation.messages.length === 0 ? (
          <p className="crm-card-sub" style={{ textAlign: "center" }}>
            Nenhuma mensagem ainda.
          </p>
        ) : (
          conversation.messages.map((message) => (
            <div key={message.id} className={`crm-comm-bubble ${message.direction}`}>
              <div>{message.body}</div>
              <div className="crm-comm-bubble-meta">
                {message.direction === "outbound" ? (message.senderName ?? "Você") : title} ·{" "}
                {formatDateTime(message.createdAt)}
              </div>
            </div>
          ))
        )}
      </div>

      <MessageComposer conversationId={conversation.id} templates={templates} onSent={onChanged} />
    </div>
  );
}
