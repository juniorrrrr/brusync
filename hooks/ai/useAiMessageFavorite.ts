"use client";

import { useState, useTransition } from "react";
import { toggleAiMessageFavoriteAction } from "@/application/ai/aiChatActions";

/** Mesmo padrão de hooks/knowledge/useKnowledgeFavorite.ts. */
export function useAiMessageFavorite(messageId: string, initialFavorite: boolean) {
  const [favorite, setFavorite] = useState(initialFavorite);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next = !favorite;
    setFavorite(next);
    startTransition(async () => {
      const result = await toggleAiMessageFavoriteAction(messageId, next);
      if (!result.ok) setFavorite(!next);
    });
  }

  return { favorite, toggle, isPending };
}
