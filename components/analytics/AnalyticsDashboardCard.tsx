"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  archiveDashboardAction,
  deleteDashboardAction,
  duplicateDashboardAction,
} from "@/application/analytics/analyticsActions";
import { IconArchive, IconStar, IconTrash } from "@/components/ui/icons";
import { useAnalyticsDashboardFavorite } from "@/hooks/analytics/useAnalyticsDashboardFavorite";
import type { AnalyticsDashboard } from "@/types/analytics";

export function AnalyticsDashboardCard({
  dashboard,
  isFavorite,
}: {
  dashboard: AnalyticsDashboard;
  isFavorite: boolean;
}) {
  const { favorite, toggle } = useAnalyticsDashboardFavorite(dashboard.id, isFavorite);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function duplicate() {
    startTransition(async () => {
      const result = await duplicateDashboardAction(dashboard.id);
      if (result.dashboardId) router.push(`/analytics/${result.dashboardId}`);
      else router.refresh();
    });
  }

  function archive() {
    startTransition(async () => {
      await archiveDashboardAction(dashboard.id);
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      await deleteDashboardAction(dashboard.id);
      router.refresh();
    });
  }

  return (
    <div className="crm-card crm-card-pad crm-an-dashboard-card">
      <div className="crm-int-card-top">
        <Link href={`/analytics/${dashboard.id}`} className="crm-proc-card-title">
          {dashboard.name}
        </Link>
        <button
          type="button"
          className={`crm-icon-btn crm-ai-fav-btn${favorite ? " active" : ""}`}
          onClick={toggle}
          aria-pressed={favorite}
          aria-label="Favoritar dashboard"
        >
          <IconStar size={14} />
        </button>
      </div>
      {dashboard.description && <p className="crm-card-sub">{dashboard.description}</p>}
      <div className="crm-proc-card-meta">
        <span>Por {dashboard.createdByName ?? "—"}</span>
        <span>Atualizado {new Date(dashboard.updatedAt).toLocaleDateString("pt-BR")}</span>
      </div>
      <div className="crm-int-card-actions">
        <button type="button" className="btn btn-outline" disabled={isPending} onClick={duplicate}>
          Duplicar
        </button>
        <button type="button" className="btn btn-outline" disabled={isPending} onClick={archive}>
          <IconArchive size={13} /> Arquivar
        </button>
        <button type="button" className="btn btn-outline" disabled={isPending} onClick={remove}>
          <IconTrash size={13} /> Excluir
        </button>
      </div>
    </div>
  );
}
