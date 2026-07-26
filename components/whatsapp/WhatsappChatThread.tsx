"use client";

import { useRouter } from "next/navigation";
import {
  assignWhatsappOwnerAction,
  setWhatsappConversationStatusAction,
  toggleWhatsappArchiveAction,
} from "@/application/whatsapp/whatsappChatActions";
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { IconArchive, IconStar } from "@/components/ui/icons";
import { WhatsappComposer } from "@/components/whatsapp/WhatsappComposer";
import { WhatsappMessageBubble } from "@/components/whatsapp/WhatsappMessageBubble";
import { useWhatsappChat, WhatsappChatProvider } from "@/contexts/whatsapp/WhatsappChatContext";
import { CONVERSATION_STATUS_BADGE, CONVERSATION_STATUS_LABEL } from "@/domain/whatsapp/statusMeta";
import { useWhatsappConversationFavorite } from "@/hooks/whatsapp/useWhatsappConversationFavorite";
import type { WhatsappConversationDetail } from "@/types/whatsapp";

function ThreadHeader({
  conversation,
  owners,
}: {
  conversation: WhatsappConversationDetail;
  owners: { id: string; name: string | null; email: string | null }[];
}) {
  const router = useRouter();
  const { favorite, toggle: toggleFavorite } = useWhatsappConversationFavorite(
    conversation.id,
    conversation.isFavorite,
  );
  const title =
    conversation.crmLeadName ??
    conversation.clientCompany ??
    conversation.contact.profileName ??
    conversation.contact.phoneNumber;

  async function handleOwnerChange(ownerId: string) {
    await assignWhatsappOwnerAction(conversation.id, ownerId || null);
    router.refresh();
  }

  async function handleArchive() {
    await toggleWhatsappArchiveAction(conversation.id, !conversation.isArchived);
    router.refresh();
  }

  async function handleStatusToggle() {
    await setWhatsappConversationStatusAction(
      conversation.id,
      conversation.status === "encerrada" ? "aberta" : "encerrada",
    );
    router.refresh();
  }

  return (
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
          {conversation.contact.phoneNumber}
          <span className={`crm-badge ${CONVERSATION_STATUS_BADGE[conversation.status]}`}>
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
              {owner.name ?? owner.email}
            </option>
          ))}
        </select>

        <button
          type="button"
          className={`btn ${favorite ? "btn-accent" : "btn-outline"}`}
          style={{ padding: "6px 8px" }}
          onClick={toggleFavorite}
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
        <button type="button" className="btn btn-outline" onClick={handleStatusToggle}>
          {conversation.status === "encerrada" ? "Reabrir" : "Encerrar"}
        </button>
      </div>
    </div>
  );
}

function ThreadMessages({ contactName }: { contactName: string }) {
  const { messages } = useWhatsappChat();
  return (
    <div className="crm-comm-thread-scroll">
      {messages.length === 0 ? (
        <p className="crm-card-sub" style={{ textAlign: "center" }}>
          Nenhuma mensagem ainda.
        </p>
      ) : (
        messages.map((message) => (
          <WhatsappMessageBubble key={message.id} message={message} contactName={contactName} />
        ))
      )}
    </div>
  );
}

export function WhatsappChatThread({
  conversation,
  owners,
}: {
  conversation: WhatsappConversationDetail | null;
  owners: { id: string; name: string | null; email: string | null }[];
}) {
  if (!conversation) {
    return (
      <div className="crm-comm-pane">
        <div className="crm-comm-empty">
          <Empty>
            <EmptyMedia variant="icon">💬</EmptyMedia>
            <EmptyTitle>Selecione uma conversa</EmptyTitle>
            <EmptyDescription>
              Escolha uma conversa na lista ao lado para ver o histórico.
            </EmptyDescription>
          </Empty>
        </div>
      </div>
    );
  }

  const contactName = conversation.contact.profileName ?? conversation.contact.phoneNumber;

  return (
    <WhatsappChatProvider conversationId={conversation.id} initialMessages={conversation.messages}>
      <div className="crm-comm-pane">
        <ThreadHeader conversation={conversation} owners={owners} />
        <ThreadMessages contactName={contactName} />
        <WhatsappComposer />
      </div>
    </WhatsappChatProvider>
  );
}
