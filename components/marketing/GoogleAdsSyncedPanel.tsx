import Link from "next/link";
import { formatCurrencyBRL, formatDate } from "@/domain/crm/format";
import type { GoogleAdsDashboardData } from "@/types/googleAds";

/** Google Ads real spend/performance, já sincronizado pela Central de
 * Integrações (Fase 35) — mesmo espírito de MetaAdsSyncedPanel.tsx (Fase
 * 34): reaproveita application/googleAds/googleAdsQueries.ts, a mesma
 * consulta que Analytics já chama, nenhuma consulta nova. Deliberadamente
 * separado do "Investimento Total" existente pela mesma razão. */
export function GoogleAdsSyncedPanel({ data }: { data: GoogleAdsDashboardData }) {
  if (!data.account) {
    return (
      <div className="crm-card crm-card-pad reveal in">
        <div className="crm-card-title">Google Ads</div>
        <p className="crm-card-sub" style={{ marginTop: 8 }}>
          Nenhuma conta do Google Ads conectada — conecte em{" "}
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
          <div className="crm-card-title">Google Ads</div>
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
