"use client";

import { useState, useTransition } from "react";
import { toggleChecklistItemAction } from "@/application/processes/processesActions";
import type { ProcessChecklistItemStatus } from "@/types/processes";

/** Toggle otimista de status de item de checklist — mesmo padrão de
 * hooks/knowledge/useKnowledgeFavorite.ts. */
export function useProcessChecklistItem(
  itemId: string,
  processId: string,
  initialStatus: ProcessChecklistItemStatus,
) {
  const [status, setStatus] = useState<ProcessChecklistItemStatus>(initialStatus);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const previous = status;
    const next: ProcessChecklistItemStatus = status === "concluido" ? "pendente" : "concluido";
    setStatus(next);

    startTransition(async () => {
      const result = await toggleChecklistItemAction(itemId, processId, next);
      if (!result.ok) {
        setStatus(previous);
        return;
      }
      if (result.item) setStatus(result.item.status);
    });
  }

  return { status, toggle, isPending };
}
