import { KpiCard } from "@/components/dashboard/KpiCard";
import {
  IconBolt,
  IconChart,
  IconCheckCircle,
  IconClock,
  IconTarget,
  IconWallet,
} from "@/components/ui/icons";
import { formatCurrencyBRL, formatPercent } from "@/domain/crm/format";
import type { MetaAdsSummary } from "@/types/metaAds";

export function MetaAdsDashboardSummary({ summary }: { summary: MetaAdsSummary }) {
  return (
    <div className="crm-kpi-grid">
      <KpiCard
        label="Investimento (30d)"
        value={formatCurrencyBRL(summary.spend)}
        icon={IconWallet}
      />
      <KpiCard
        label="Impressões"
        value={summary.impressions.toLocaleString("pt-BR")}
        icon={IconChart}
      />
      <KpiCard label="Cliques" value={summary.clicks.toLocaleString("pt-BR")} icon={IconTarget} />
      <KpiCard
        label="CTR"
        value={summary.metrics.ctr !== null ? formatPercent(summary.metrics.ctr) : "—"}
        icon={IconBolt}
      />
      <KpiCard
        label="CPA"
        value={summary.metrics.cpa !== null ? formatCurrencyBRL(summary.metrics.cpa) : "—"}
        icon={IconClock}
      />
      <KpiCard
        label="ROAS"
        value={summary.metrics.roas !== null ? `${summary.metrics.roas.toFixed(2)}x` : "—"}
        icon={IconCheckCircle}
        hint={`${summary.activeCampaigns} ativa${summary.activeCampaigns === 1 ? "" : "s"} · ${summary.pausedCampaigns} pausada${summary.pausedCampaigns === 1 ? "" : "s"}`}
      />
    </div>
  );
}
