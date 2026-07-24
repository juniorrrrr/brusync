"use client";

import { useState, useTransition } from "react";
import { toggleKnowledgeFavoriteAction } from "@/application/knowledge/knowledgeFavoritesActions";

/** Optimistic favorite toggle shared by every place a document card shows up
 * (dashboard, library, favorites, document detail) — avoids each caller
 * re-implementing the same pending/error dance. */
export function useKnowledgeFavorite(documentId: string, initialFavorite: boolean) {
  const [favorite, setFavorite] = useState(initialFavorite);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next = !favorite;
    setFavorite(next);
    startTransition(async () => {
      const result = await toggleKnowledgeFavoriteAction(documentId);
      if (!result.ok || result.favorite === undefined) {
        setFavorite(!next);
        return;
      }
      setFavorite(result.favorite);
    });
  }

  return { favorite, toggle, isPending };
}
