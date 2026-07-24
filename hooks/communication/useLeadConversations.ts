"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchConversationsForLead } from "@/application/communication/leadConversationsQueries";
import type { Conversation } from "@/types/communication";

/** Client-side data source for the Lead Workspace's "Comunicação" tab. */
export function useLeadConversations(crmLeadId: string) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    setLoading(true);
    fetchConversationsForLead(crmLeadId)
      .then(setConversations)
      .finally(() => setLoading(false));
  }, [crmLeadId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { conversations, loading, reload };
}
