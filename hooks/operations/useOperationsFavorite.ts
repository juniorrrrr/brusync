"use client";

import { useState, useTransition } from "react";
import {
  addOperationsFavoriteAction,
  removeOperationsFavoriteAction,
} from "@/application/operations/operationsFavoritesActions";
import type { OperationsFavoriteEntityType } from "@/types/operations";

export function useOperationsFavorite(params: {
  entityType: OperationsFavoriteEntityType;
  entityId: string;
  label: string;
  href: string | null;
  initialFavorite: boolean;
}) {
  const [favorite, setFavorite] = useState(params.initialFavorite);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next = !favorite;
    setFavorite(next);
    startTransition(async () => {
      const result = next
        ? await addOperationsFavoriteAction({
            entityType: params.entityType,
            entityId: params.entityId,
            label: params.label,
            href: params.href,
          })
        : await removeOperationsFavoriteAction(params.entityType, params.entityId);
      if (!result.ok) setFavorite(!next);
    });
  }

  return { favorite, toggle, isPending };
}
