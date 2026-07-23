"use client";

import { createContext, type ReactNode, useCallback, useContext, useState } from "react";
import { sendClientMessageAction } from "@/application/clientPortal/portalMessagesActions";
import type { PortalMessage } from "@/types/clientPortal";

interface PortalMessagesContextValue {
  messages: PortalMessage[];
  sending: boolean;
  error: string | null;
  send: (body: string) => Promise<void>;
}

const PortalMessagesContext = createContext<PortalMessagesContextValue | null>(null);

/** Holds one project's message thread client-side so the composer (posts a
 * message) and the list (renders it) can share state without a full
 * server round-trip for every keystroke — the send itself still goes
 * through sendClientMessageAction, this just gives instant feedback once it
 * succeeds instead of waiting on the next full page data refetch. */
export function PortalMessagesProvider({
  projectId,
  initialMessages,
  children,
}: {
  projectId: string;
  initialMessages: PortalMessage[];
  children: ReactNode;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(
    async (body: string) => {
      if (!body.trim()) return;
      setSending(true);
      setError(null);

      const formData = new FormData();
      formData.set("projectId", projectId);
      formData.set("body", body.trim());

      const result = await sendClientMessageAction({ status: "idle" }, formData);
      if (result.status === "error") {
        setError(result.message ?? "Falha ao enviar mensagem.");
        setSending(false);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `optimistic-${Date.now()}`,
          projectId,
          authorType: "cliente",
          authorProfileId: null,
          authorName: "Você",
          body: body.trim(),
          createdAt: new Date().toISOString(),
        },
      ]);
      setSending(false);
    },
    [projectId],
  );

  return (
    <PortalMessagesContext.Provider value={{ messages, sending, error, send }}>
      {children}
    </PortalMessagesContext.Provider>
  );
}

export function usePortalMessages() {
  const ctx = useContext(PortalMessagesContext);
  if (!ctx) throw new Error("usePortalMessages must be used within PortalMessagesProvider");
  return ctx;
}
