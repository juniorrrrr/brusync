"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
  useTransition,
} from "react";
import { regenerateAiMessageAction, sendAiMessageAction } from "@/application/ai/aiChatActions";
import type { AiContextType, AiMessage } from "@/types/ai";

interface AiChatContextValue {
  conversationId: string | null;
  messages: AiMessage[];
  isPending: boolean;
  contextType: AiContextType;
  contextRef: string | null;
  sendMessage: (question: string) => void;
  regenerate: (assistantMessageId: string) => void;
}

const AiChatContext = createContext<AiChatContextValue | null>(null);

/** Estado do Chat IA — inicializado com a conversa já carregada no servidor
 * (application/ai/aiQueries.ts::fetchAiChatPageData) e depois mutado 100%
 * no cliente, um par de mensagens por vez, sempre via
 * application/ai/aiChatActions.ts (nunca chama o AiProvider diretamente). */
export function AiChatProvider({
  children,
  initialConversationId,
  initialMessages,
  contextType,
  contextRef,
}: {
  children: ReactNode;
  initialConversationId: string | null;
  initialMessages: AiMessage[];
  contextType: AiContextType;
  contextRef: string | null;
}) {
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [messages, setMessages] = useState(initialMessages);
  const [isPending, startTransition] = useTransition();

  const sendMessage = useCallback(
    (question: string) => {
      const trimmed = question.trim();
      if (!trimmed) return;
      startTransition(async () => {
        const result = await sendAiMessageAction({
          conversationId,
          contextType,
          contextRef,
          question: trimmed,
        });
        setConversationId(result.conversationId);
        setMessages((prev) => [...prev, result.userMessage, result.assistantMessage]);
      });
    },
    [conversationId, contextType, contextRef],
  );

  const regenerate = useCallback(
    (assistantMessageId: string) => {
      const index = messages.findIndex((m) => m.id === assistantMessageId);
      if (index <= 0 || !conversationId) return;
      const question = messages[index - 1]?.content;
      if (!question) return;
      const attempt = messages
        .slice(0, index + 1)
        .filter((m, i) => m.role === "assistant" && i > index - 1).length;

      startTransition(async () => {
        const message = await regenerateAiMessageAction({
          conversationId,
          contextType,
          contextRef,
          question,
          attempt,
        });
        setMessages((prev) => [...prev, message]);
      });
    },
    [messages, conversationId, contextType, contextRef],
  );

  const value = useMemo(
    () => ({
      conversationId,
      messages,
      isPending,
      contextType,
      contextRef,
      sendMessage,
      regenerate,
    }),
    [conversationId, messages, isPending, contextType, contextRef, sendMessage, regenerate],
  );

  return <AiChatContext.Provider value={value}>{children}</AiChatContext.Provider>;
}

export function useAiChat() {
  const ctx = useContext(AiChatContext);
  if (!ctx) throw new Error("useAiChat deve ser usado dentro de AiChatProvider");
  return ctx;
}
