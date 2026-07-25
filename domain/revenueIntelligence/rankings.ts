import type { OwnerConversion } from "@/domain/intelligence/dataset";
import type { FinancialBreakdownItem, FinancialMarketingIndicators } from "@/types/financial";
import type {
  ConversionBreakdownRow,
  RankingRow,
  RevenueRankings,
} from "@/types/revenueIntelligence";

function toRankingRows(
  items: FinancialBreakdownItem[],
  secondaryByLabel: Map<string, number> | undefined,
  secondaryLabel: string,
): RankingRow[] {
  return items.map((item) => ({
    label: item.label,
    revenue: item.value,
    secondaryLabel,
    secondaryValue: secondaryByLabel?.get(item.label) ?? null,
  }));
}

function conversionByLabel(rows: ConversionBreakdownRow[]): Map<string, number> {
  return new Map(rows.map((row) => [row.label, row.conversionRate]));
}

/** Todas as tabelas de ranking vêm de dado já computado em outro módulo —
 * receita real por dimensão de `getFinancialMarketingIndicators()`
 * (application/financial), sem nenhuma query nova. "Top serviços" (pedido no
 * briefing) não existe: não há campo de serviço/produto vendido em lead,
 * cliente ou transação — documentado como gap, não implementado. */
export function buildRevenueRankings(
  indicators: FinancialMarketingIndicators,
  revenueByClient: FinancialBreakdownItem[],
  ownerConversion: OwnerConversion[],
  conversionByDimension: {
    vendedor: ConversionBreakdownRow[];
    canal: ConversionBreakdownRow[];
    cidade: ConversionBreakdownRow[];
  },
): RevenueRankings {
  const winRateByOwner = new Map(ownerConversion.map((owner) => [owner.ownerName, owner.winRate]));

  return {
    topSellers: toRankingRows(indicators.revenueByOwner, winRateByOwner, "Taxa de vitória"),
    topCampaigns: toRankingRows(indicators.revenueByCampaign, undefined, "Conversão"),
    topChannels: toRankingRows(
      indicators.revenueByChannel,
      conversionByLabel(conversionByDimension.canal),
      "Conversão",
    ),
    topCities: toRankingRows(
      indicators.revenueByCity,
      conversionByLabel(conversionByDimension.cidade),
      "Conversão",
    ),
    topClients: toRankingRows(revenueByClient, undefined, "Conversão"),
    topSources: toRankingRows(indicators.revenueByOrigin, undefined, "Conversão"),
  };
}
