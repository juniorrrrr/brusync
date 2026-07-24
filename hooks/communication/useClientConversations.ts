"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchConversationsForClient } from "@/application/communication/clientConversationsQueries";
import type { Conversation } from "@/types/communication";

/** Client-side data source for the Client Drawer's "Comunicação" section. */
export function useClientConversations(clientId: string) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    setLoading(true);
    fetchConversationsForClient(clientId)
      .then(setConversations)
      .finally(() => setLoading(false));
  }, [clientId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { conversations, loading, reload };
}
