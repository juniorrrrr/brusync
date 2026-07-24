"use client";

import { useState, useTransition } from "react";
import { setKnowledgeDocumentPinnedAction } from "@/application/knowledge/knowledgeFavoritesActions";
import { IconTarget } from "@/components/ui/icons";

export function KnowledgePinButton({
  documentId,
  initialPinned,
}: {
  documentId: string;
  initialPinned: boolean;
}) {
  const [pinned, setPinned] = useState(initialPinned);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next = !pinned;
    setPinned(next);
    startTransition(async () => {
      const result = await setKnowledgeDocumentPinnedAction(documentId, next);
      if (!result.ok) setPinned(!next);
    });
  }

  return (
    <button
      type="button"
      className={`crm-kb-fav-btn${pinned ? " active" : ""}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      }}
      disabled={isPending}
      aria-label={pinned ? "Desafixar" : "Fixar"}
      aria-pressed={pinned}
      title={pinned ? "Desafixar" : "Fixar"}
    >
      <IconTarget size={15} />
    </button>
  );
}
