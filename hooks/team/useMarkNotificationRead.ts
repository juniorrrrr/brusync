"use client";

import { useState, useTransition } from "react";
import { markTeamNotificationReadAction } from "@/application/team/teamNotificationsActions";

/** Optimistic "marcar como lida" — mesmo padrão de
 * hooks/knowledge/useKnowledgeFavorite.ts. */
export function useMarkNotificationRead(id: string, initialReadAt: string | null) {
  const [readAt, setReadAt] = useState(initialReadAt);
  const [isPending, startTransition] = useTransition();

  function markRead() {
    if (readAt) return;
    const now = new Date().toISOString();
    setReadAt(now);
    startTransition(async () => {
      const result = await markTeamNotificationReadAction(id);
      if (!result.ok) setReadAt(null);
    });
  }

  return { readAt, markRead, isPending };
}
