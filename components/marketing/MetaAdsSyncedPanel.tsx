import Link from "next/link";
import { formatCurrencyBRL, formatDate } from "@/domain/crm/format";
import type { MetaAdsDashboardData } from "@/types/metaAds";

/** Meta Ads real spend/performance, already synced by the Central de
 * Integrações (Fase 34) — reuses application/metaAds/metaAdsQueries.ts's
 * fetchMetaAdsDashboardData, the exact same query Analytics already calls,
 * so this never runs a second query against the same data. Deliberately
 * kept separate from the KPI grid above: those numbers come from
 * manually-entered investment (application/marketingAnalytics/spend.ts) and
 * merging real ad spend into that total would silently change an existing
 * ROAS/CAC calculation — out of scope for "apenas alimentar automaticamente
 * o módulo existente" without touching a business rule. */
export function MetaAdsSyncedPanel({ data }: { data: MetaAdsDashboardData }) {
  if (!data.account) {
    return (
      <div className="crm-card crm-card-pad reveal in">
        <div className="crm-card-title">Meta Ads</div>
        <p className="crm-card-sub" style={{ marginTop: 8 }}>
          Nenhuma conta do Meta Ads conectada — conecte em{" "}
          <Link href="/integracoes" style={{ color: "var(--accent)" }}>
            Central de Integrações
          </Link>{" "}
          para ver o investimento real sincronizado automaticamente aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="crm-card crm-card-pad reveal in">
      <div className="crm-card-head">
        <div>
          <div className="crm-card-title">Meta Ads</div>
          <div className="crm-card-sub">
            Sincronizado automaticamente
            {data.lastSyncAt ? ` — última sincronização em ${formatDate(data.lastSyncAt)}` : ""}
          </div>
        </div>
      </div>
      <div
        className="crm-kpi-grid"
        style={{ marginTop: 12, gridTemplateColumns: "repeat(4, 1fr)" }}
      >
        <div>
          <div className="crm-card-sub">Investimento</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--primary)" }}>
            {formatCurrencyBRL(data.summary.spend)}
          </div>
        </div>
        <div>
          <div className="crm-card-sub">Cliques</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--primary)" }}>
            {data.summary.clicks.toLocaleString("pt-BR")}
          </div>
        </div>
        <div>
          <div className="crm-card-sub">Conversões</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--primary)" }}>
            {data.summary.conversions.toLocaleString("pt-BR")}
          </div>
        </div>
        <div>
          <div className="crm-card-sub">Campanhas ativas</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--primary)" }}>
            {data.summary.activeCampaigns}
          </div>
        </div>
      </div>
    </div>
  );
}
