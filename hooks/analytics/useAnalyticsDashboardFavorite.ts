"use client";

import { useState, useTransition } from "react";
import { toggleDashboardFavoriteAction } from "@/application/analytics/analyticsActions";

/** Mesmo padrão de hooks/knowledge/useKnowledgeFavorite.ts. */
export function useAnalyticsDashboardFavorite(dashboardId: string, initialFavorite: boolean) {
  const [favorite, setFavorite] = useState(initialFavorite);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next = !favorite;
    setFavorite(next);
    startTransition(async () => {
      const result = await toggleDashboardFavoriteAction(dashboardId, next);
      if (!result.ok) setFavorite(!next);
    });
  }

  return { favorite, toggle, isPending };
}
