import { BreakdownPanel } from "@/components/conversions/BreakdownPanel";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { IconChart, IconTarget, IconWallet } from "@/components/ui/icons";
import type { FinancialMarketingIndicators } from "@/types/financial";

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatMetric(value: number | null, formatter: (n: number) => string): string {
  return value === null ? "—" : formatter(value);
}

function toBreakdownItems(items: { label: string; value: number }[]) {
  return items.map((item) => ({ label: item.label, count: Math.round(item.value) }));
}

/** New "Financeiro" sub-page of Marketing Intelligence — CAC/ROI/ROAS use
 * real paid revenue (crm_financial_transactions/installments), never
 * crm_leads.potential_value like the existing "Executivo" page; spend
 * comes from the same marketing_campaign_spend the module already has.
 * "—" (never a fabricated zero) whenever no spend was logged for the
 * period — same honesty rule that module already documents. */
export function MarketingFinancialPanel({ data }: { data: FinancialMarketingIndicators }) {
  return (
    <div>
      <div className="crm-kpi-grid">
        <KpiCard
          label="CAC"
          value={formatMetric(data.cac, formatCurrency)}
          icon={IconWallet}
          hint="Custo de aquisição por cliente"
        />
        <KpiCard
          label="ROI"
          value={data.roi === null ? "—" : `${Math.round(data.roi * 100)}%`}
          icon={IconChart}
          hint="Retorno sobre o investimento"
        />
        <KpiCard
          label="ROAS"
          value={data.roas === null ? "—" : `${data.roas.toFixed(1)}x`}
          icon={IconTarget}
          hint="Receita por real investido"
        />
        <KpiCard
          label="Investimento total"
          value={formatCurrency(data.totalSpend)}
          icon={IconWallet}
        />
      </div>

      <div className="crm-fin-breakdown-grid">
        <BreakdownPanel
          title="Receita por campanha"
          subtitle="Vinculada via evento de conversão"
          items={toBreakdownItems(data.revenueByCampaign)}
        />
        <BreakdownPanel
          title="Receita por origem"
          subtitle="Origem do lead que gerou a receita"
          items={toBreakdownItems(data.revenueByOrigin)}
        />
        <BreakdownPanel
          title="Receita por canal"
          subtitle="UTM medium do evento de conversão"
          items={toBreakdownItems(data.revenueByChannel)}
        />
        <BreakdownPanel
          title="Receita por UTM"
          subtitle="UTM source do evento de conversão"
          items={toBreakdownItems(data.revenueByUtmSource)}
        />
        <BreakdownPanel
          title="Receita por responsável"
          subtitle="Responsável pelo projeto"
          items={toBreakdownItems(data.revenueByOwner)}
        />
        <BreakdownPanel
          title="Receita por cidade"
          subtitle="Cidade do lead original"
          items={toBreakdownItems(data.revenueByCity)}
        />
      </div>
    </div>
  );
}
