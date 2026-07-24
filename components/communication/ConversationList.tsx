"use client";

import { useRouter } from "next/navigation";
import { markConversationReadAction } from "@/application/communication/conversationsActions";
import { ConversationFilterBar } from "@/components/communication/ConversationFilterBar";
import { ConversationListRow } from "@/components/communication/ConversationListRow";
import { IconPlus } from "@/components/ui/icons";
import { useConversationDialog } from "@/contexts/communication/ConversationDialogContext";
import { useUpdateSearchParams } from "@/hooks/crm/useUpdateSearchParams";
import type { Channel, Conversation } from "@/types/communication";
import type { OwnerRef } from "@/types/crm";

export function ConversationList({
  conversations,
  channels,
  owners,
  selectedId,
}: {
  conversations: Conversation[];
  channels: Channel[];
  owners: OwnerRef[];
  selectedId: string | null;
}) {
  const { update } = useUpdateSearchParams();
  const router = useRouter();
  const { openCreate } = useConversationDialog();

  function handleSelect(conversation: Conversation) {
    update({ conversationId: conversation.id });
    if (conversation.unreadCount > 0) {
      void markConversationReadAction(conversation.id).then(() => router.refresh());
    }
  }

  return (
    <div className="crm-comm-pane">
      <div className="crm-comm-pane-head">
        <span className="crm-drawer-section-title" style={{ marginBottom: 0 }}>
          Conversas
        </span>
        <button
          type="button"
          className="btn btn-accent"
          style={{ padding: "6px 10px" }}
          onClick={() => openCreate()}
          aria-label="Nova conversa"
        >
          <IconPlus size={14} />
        </button>
      </div>

      <ConversationFilterBar channels={channels} owners={owners} />

      <div className="crm-comm-list-scroll">
        {conversations.length === 0 ? (
          <p className="crm-card-sub" style={{ padding: 16, textAlign: "center" }}>
            Nenhuma conversa encontrada para os filtros selecionados.
          </p>
        ) : (
          conversations.map((conversation) => (
            <ConversationListRow
              key={conversation.id}
              conversation={conversation}
              active={conversation.id === selectedId}
              onSelect={() => handleSelect(conversation)}
            />
          ))
        )}
      </div>
    </div>
  );
}
