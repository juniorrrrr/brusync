import type { Metadata } from "next";
import { fetchMetaAdsDashboardData } from "@/application/metaAds/metaAdsQueries";
import { MetaAdsAlertsList } from "@/components/metaAds/MetaAdsAlertsList";
import { MetaAdsDashboardSummary } from "@/components/metaAds/MetaAdsDashboardSummary";
import { MetaAdsFilterBar } from "@/components/metaAds/MetaAdsFilterBar";
import { MetaAdsTopList } from "@/components/metaAds/MetaAdsTopList";
import { formatCurrencyBRL } from "@/domain/crm/format";

export const metadata: Metadata = {
  title: "Meta Ads — Brusync OS",
};

export default async function MetaAdsDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const data = await fetchMetaAdsDashboardData(params.adAccountId);

  if (!data.account) {
    return (
      <div className="crm-card crm-card-pad">
        <div className="crm-card-title">Nenhuma conta do Meta Ads conectada</div>
        <p className="crm-card-sub" style={{ marginTop: 8 }}>
          Conecte uma conta em{" "}
          <a href="/meta-ads/configuracoes" style={{ color: "var(--primary)" }}>
            Configurações
          </a>{" "}
          para começar a sincronizar campanhas.
        </p>
      </div>
    );
  }

  return (
    <div>
      <MetaAdsFilterBar adAccounts={data.adAccounts} />
      <MetaAdsDashboardSummary summary={data.summary} />

      <div className="crm-fin-charts-row" style={{ marginTop: 16 }}>
        <MetaAdsAlertsList alerts={data.alerts} />
        <div className="crm-card crm-card-pad reveal in">
          <div className="crm-card-title">Gasto diário (30 dias)</div>
          {data.dailySpend.length === 0 ? (
            <p className="crm-card-sub" style={{ marginTop: 12 }}>
              Sem dados sincronizados ainda.
            </p>
          ) : (
            <div className="crm-mini-list">
              {data.dailySpend.slice(-14).map((point) => (
                <div key={point.date} className="crm-mini-row">
                  <span className="crm-mini-ico">•</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="crm-mini-title">
                      {new Date(`${point.date}T00:00:00`).toLocaleDateString("pt-BR")}
                    </div>
                    <div className="crm-mini-meta">{point.conversions} conversões</div>
                  </div>
                  <span className="crm-mini-meta">{formatCurrencyBRL(point.spend)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="crm-fin-charts-row" style={{ marginTop: 16 }}>
        <MetaAdsTopList title="Top campanhas" campaigns={data.topCampaigns} />
        <MetaAdsTopList title="Piores campanhas" campaigns={data.worstCampaigns} />
      </div>
    </div>
  );
}
