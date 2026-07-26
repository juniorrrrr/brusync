"use client";

import { useState, useTransition } from "react";
import { toggleWhatsappFavoriteAction } from "@/application/whatsapp/whatsappChatActions";

/** Mesmo padrão de hooks/knowledge/useKnowledgeFavorite.ts. */
export function useWhatsappConversationFavorite(conversationId: string, initialFavorite: boolean) {
  const [favorite, setFavorite] = useState(initialFavorite);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next = !favorite;
    setFavorite(next);
    startTransition(async () => {
      const result = await toggleWhatsappFavoriteAction(conversationId, next);
      if (!result.ok) setFavorite(!next);
    });
  }

  return { favorite, toggle, isPending };
}
