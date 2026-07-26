"use client";

import { useState, useTransition } from "react";
import { toggleAiSuggestionFavoriteAction } from "@/application/ai/aiSuggestionsActions";

export function useAiSuggestionFavorite(suggestionId: string, initialFavorite: boolean) {
  const [favorite, setFavorite] = useState(initialFavorite);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next = !favorite;
    setFavorite(next);
    startTransition(async () => {
      const result = await toggleAiSuggestionFavoriteAction(suggestionId, next);
      if (!result.ok) setFavorite(!next);
    });
  }

  return { favorite, toggle, isPending };
}
