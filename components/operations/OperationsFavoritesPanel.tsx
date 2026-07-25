"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { removeOperationsFavoriteAction } from "@/application/operations/operationsFavoritesActions";
import { IconStar, IconTrash } from "@/components/ui/icons";
import type { OperationsFavorite } from "@/types/operations";

export function OperationsFavoritesPanel({ favorites }: { favorites: OperationsFavorite[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleRemove(favorite: OperationsFavorite) {
    startTransition(async () => {
      await removeOperationsFavoriteAction(favorite.entityType, favorite.entityId);
      router.refresh();
    });
  }

  if (favorites.length === 0) return null;

  return (
    <div className="crm-card crm-card-pad reveal in">
      <div className="crm-card-head">
        <div>
          <div className="crm-card-title" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <IconStar size={15} /> Favoritos
          </div>
        </div>
      </div>
      <div className="crm-tags" style={{ marginTop: 8 }}>
        {favorites.map((favorite) => (
          <span
            key={favorite.id}
            className="crm-tag"
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <Link href={favorite.href ?? "#"}>{favorite.label}</Link>
            <button
              type="button"
              onClick={() => handleRemove(favorite)}
              disabled={isPending}
              aria-label="Remover favorito"
              style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}
            >
              <IconTrash size={11} />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
