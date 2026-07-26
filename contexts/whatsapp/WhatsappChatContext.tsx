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
import { sendWhatsappMessageAction } from "@/application/whatsapp/whatsappChatActions";
import type { WhatsappMessage } from "@/types/whatsapp";

interface WhatsappChatContextValue {
  conversationId: string;
  messages: WhatsappMessage[];
  isPending: boolean;
  error: string | null;
  sendMessage: (body: string) => void;
}

const WhatsappChatContext = createContext<WhatsappChatContextValue | null>(null);

/** Estado do Chat — inicializado com as mensagens já carregadas no servidor
 * e mutado no cliente a cada envio, sempre via
 * application/whatsapp/whatsappChatActions.ts::sendWhatsappMessageAction
 * (que delega 100% para o WhatsappProvider) — mesmo padrão de
 * contexts/ai/AiChatContext.tsx (Fase 26). */
export function WhatsappChatProvider({
  children,
  conversationId,
  initialMessages,
}: {
  children: ReactNode;
  conversationId: string;
  initialMessages: WhatsappMessage[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const sendMessage = useCallback(
    (body: string) => {
      startTransition(async () => {
        const result = await sendWhatsappMessageAction(conversationId, body);
        if (result.ok && result.message) {
          setMessages((prev) => [...prev, result.message as WhatsappMessage]);
          setError(null);
        } else {
          setError(result.error ?? "Falha ao enviar mensagem.");
        }
      });
    },
    [conversationId],
  );

  const value = useMemo(
    () => ({ conversationId, messages, isPending, error, sendMessage }),
    [conversationId, messages, isPending, error, sendMessage],
  );

  return <WhatsappChatContext.Provider value={value}>{children}</WhatsappChatContext.Provider>;
}

export function useWhatsappChat() {
  const ctx = useContext(WhatsappChatContext);
  if (!ctx) throw new Error("useWhatsappChat deve ser usado dentro de WhatsappChatProvider");
  return ctx;
}
