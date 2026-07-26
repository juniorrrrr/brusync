import { formatCurrencyBRL } from "@/domain/crm/format";
import type { MetaAdsCampaignSummary } from "@/types/metaAds";

export function MetaAdsTopList({
  title,
  campaigns,
}: {
  title: string;
  campaigns: MetaAdsCampaignSummary[];
}) {
  return (
    <div className="crm-card crm-card-pad reveal in">
      <div className="crm-card-title">{title}</div>
      {campaigns.length === 0 ? (
        <p className="crm-card-sub" style={{ marginTop: 12 }}>
          Sem dados no período.
        </p>
      ) : (
        <div className="crm-mini-list">
          {campaigns.map(({ campaign, summary }) => (
            <div key={campaign.id} className="crm-mini-row">
              <span className="crm-mini-ico">•</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="crm-mini-title">{campaign.name}</div>
                <div className="crm-mini-meta">
                  {summary.metrics.roas !== null ? `ROAS ${summary.metrics.roas.toFixed(2)}x` : "—"}
                </div>
              </div>
              <span className="crm-mini-meta">{formatCurrencyBRL(summary.spend)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
