"use client";

import { AiComposer } from "@/components/ai/AiComposer";
import { AiMessageBubble } from "@/components/ai/AiMessageBubble";
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { useAiChat } from "@/contexts/ai/AiChatContext";

export function AiChatWindow() {
  const { messages, isPending } = useAiChat();

  return (
    <div className="crm-ai-chat-window">
      <div className="crm-ai-chat-messages">
        {messages.length === 0 ? (
          <Empty>
            <EmptyMedia variant="icon">🤖</EmptyMedia>
            <EmptyTitle>Pergunte algo à Brusync AI</EmptyTitle>
            <EmptyDescription>
              As respostas usam somente os dados já cadastrados no sistema — nenhuma chamada externa
              é feita.
            </EmptyDescription>
          </Empty>
        ) : (
          messages.map((message) => <AiMessageBubble key={message.id} message={message} />)
        )}
        {isPending && <div className="crm-ai-bubble assistant crm-ai-typing">Digitando…</div>}
      </div>
      <AiComposer />
    </div>
  );
}
