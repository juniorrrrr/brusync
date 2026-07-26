"use client";

import Link from "next/link";
import { useAiChat } from "@/contexts/ai/AiChatContext";
import type { AiConversation } from "@/types/ai";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function AiConversationHistoryList({ conversations }: { conversations: AiConversation[] }) {
  const { conversationId } = useAiChat();

  if (conversations.length === 0) {
    return <p className="crm-card-sub">Nenhuma conversa ainda.</p>;
  }

  return (
    <div className="crm-mini-list">
      {conversations.map((conversation) => (
        <Link
          key={conversation.id}
          href={`/ia/chat?conversationId=${conversation.id}`}
          className={`crm-ai-history-row${conversation.id === conversationId ? " active" : ""}`}
        >
          <span>{conversation.title}</span>
          <span className="crm-card-sub">{formatDate(conversation.updatedAt)}</span>
        </Link>
      ))}
    </div>
  );
}
