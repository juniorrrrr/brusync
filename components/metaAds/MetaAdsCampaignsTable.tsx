"use client";

import { useState } from "react";
import { setCampaignProjectLinkAction } from "@/application/metaAds/metaAdsCrmLinkActions";
import { formatCurrencyBRL, formatPercent } from "@/domain/crm/format";
import { CAMPAIGN_STATUS_BADGE, CAMPAIGN_STATUS_LABEL } from "@/domain/metaAds/statusMeta";
import type { MetaAdsCampaignSummary } from "@/types/metaAds";

export function MetaAdsCampaignsTable({
  campaigns,
  projectOptions,
}: {
  campaigns: MetaAdsCampaignSummary[];
  projectOptions: { id: string; name: string }[];
}) {
  const [savingId, setSavingId] = useState<string | null>(null);

  async function handleLinkProject(campaignId: string, projectId: string) {
    setSavingId(campaignId);
    await setCampaignProjectLinkAction(campaignId, projectId || null);
    setSavingId(null);
  }

  if (campaigns.length === 0) {
    return <p className="crm-card-sub">Nenhuma campanha sincronizada ainda.</p>;
  }

  return (
    <div className="crm-table-wrap">
      <table className="crm-table">
        <thead>
          <tr>
            <th>Campanha</th>
            <th>Status</th>
            <th>Gasto</th>
            <th>CTR</th>
            <th>CPA</th>
            <th>ROAS</th>
            <th>Conversões</th>
            <th>Projeto vinculado</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map(({ campaign, summary }) => (
            <tr key={campaign.id}>
              <td className="cell-strong">{campaign.name}</td>
              <td>
                <span className={`crm-badge ${CAMPAIGN_STATUS_BADGE[campaign.status]}`}>
                  {CAMPAIGN_STATUS_LABEL[campaign.status]}
                </span>
              </td>
              <td className="cell-muted">{formatCurrencyBRL(summary.spend)}</td>
              <td className="cell-muted">
                {summary.metrics.ctr !== null ? formatPercent(summary.metrics.ctr) : "—"}
              </td>
              <td className="cell-muted">
                {summary.metrics.cpa !== null ? formatCurrencyBRL(summary.metrics.cpa) : "—"}
              </td>
              <td className="cell-muted">
                {summary.metrics.roas !== null ? `${summary.metrics.roas.toFixed(2)}x` : "—"}
              </td>
              <td className="cell-muted">{summary.conversions}</td>
              <td>
                <select
                  className="crm-select"
                  value={campaign.crmProjectId ?? ""}
                  disabled={savingId === campaign.id}
                  onChange={(e) => handleLinkProject(campaign.id, e.target.value)}
                  aria-label={`Vincular projeto à campanha ${campaign.name}`}
                >
                  <option value="">Sem vínculo</option>
                  {projectOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
