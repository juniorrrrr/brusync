"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { revokeShareAction, shareDashboardAction } from "@/application/analytics/analyticsActions";
import { IconLink2, IconTrash } from "@/components/ui/icons";
import type { AnalyticsShare } from "@/types/analytics";

export function AnalyticsSharePanel({
  dashboardId,
  shares,
}: {
  dashboardId: string;
  shares: AnalyticsShare[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function createShare() {
    startTransition(async () => {
      await shareDashboardAction(dashboardId);
      router.refresh();
    });
  }

  function revoke(id: string) {
    startTransition(async () => {
      await revokeShareAction(id, dashboardId);
      router.refresh();
    });
  }

  async function copyLink(share: AnalyticsShare) {
    const url = `${window.location.origin}/analytics/compartilhado/${share.shareToken}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(share.id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  const active = shares.filter((s) => !s.revokedAt);

  return (
    <div className="crm-card crm-card-pad">
      <div className="crm-card-title">Compartilhamento</div>
      <p className="crm-card-sub">
        Link de leitura interno — qualquer colaborador logado pode abrir.
      </p>

      <div className="crm-mini-list" style={{ marginTop: 10 }}>
        {active.map((share) => (
          <div key={share.id} className="crm-an-row">
            <span>/analytics/compartilhado/{share.shareToken.slice(0, 8)}…</span>
            <div className="crm-int-card-actions">
              <button type="button" className="btn btn-outline" onClick={() => copyLink(share)}>
                <IconLink2 size={13} /> {copiedId === share.id ? "Copiado!" : "Copiar link"}
              </button>
              <button
                type="button"
                className="crm-icon-btn"
                disabled={isPending}
                onClick={() => revoke(share.id)}
              >
                <IconTrash size={13} />
              </button>
            </div>
          </div>
        ))}
        {active.length === 0 && <p className="crm-card-sub">Nenhum link ativo.</p>}
      </div>

      <button
        type="button"
        className="btn btn-accent"
        disabled={isPending}
        onClick={createShare}
        style={{ marginTop: 10 }}
      >
        Gerar link de compartilhamento
      </button>
    </div>
  );
}
