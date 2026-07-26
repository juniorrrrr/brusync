"use client";

import { useRouter } from "next/navigation";
import { markWhatsappConversationReadAction } from "@/application/whatsapp/whatsappChatActions";
import { WhatsappConversationListRow } from "@/components/whatsapp/WhatsappConversationListRow";
import { WhatsappFilterBar } from "@/components/whatsapp/WhatsappFilterBar";
import { useUpdateSearchParams } from "@/hooks/crm/useUpdateSearchParams";
import type { WhatsappConversation } from "@/types/whatsapp";

export function WhatsappConversationList({
  conversations,
  owners,
  selectedId,
}: {
  conversations: WhatsappConversation[];
  owners: { id: string; name: string | null; email: string | null }[];
  selectedId: string | null;
}) {
  const { update } = useUpdateSearchParams();
  const router = useRouter();

  function handleSelect(conversation: WhatsappConversation) {
    update({ conversationId: conversation.id });
    if (conversation.unreadCount > 0) {
      void markWhatsappConversationReadAction(conversation.id).then(() => router.refresh());
    }
  }

  return (
    <div className="crm-comm-pane">
      <div className="crm-comm-pane-head">
        <span className="crm-drawer-section-title" style={{ marginBottom: 0 }}>
          WhatsApp
        </span>
      </div>

      <WhatsappFilterBar owners={owners} />

      <div className="crm-comm-list-scroll">
        {conversations.length === 0 ? (
          <p className="crm-card-sub" style={{ padding: 16, textAlign: "center" }}>
            Nenhuma conversa encontrada para os filtros selecionados.
          </p>
        ) : (
          conversations.map((conversation) => (
            <WhatsappConversationListRow
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
