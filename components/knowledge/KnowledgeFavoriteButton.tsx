"use client";

import { IconStar } from "@/components/ui/icons";
import { useKnowledgeFavorite } from "@/hooks/knowledge/useKnowledgeFavorite";

export function KnowledgeFavoriteButton({
  documentId,
  initialFavorite,
}: {
  documentId: string;
  initialFavorite: boolean;
}) {
  const { favorite, toggle, isPending } = useKnowledgeFavorite(documentId, initialFavorite);

  return (
    <button
      type="button"
      className={`crm-kb-fav-btn${favorite ? " active" : ""}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      }}
      disabled={isPending}
      aria-label={favorite ? "Remover dos favoritos" : "Favoritar"}
      aria-pressed={favorite}
      title={favorite ? "Remover dos favoritos" : "Favoritar"}
    >
      <IconStar size={16} />
    </button>
  );
}
