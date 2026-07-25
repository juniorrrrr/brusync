import type { OwnerConversion } from "@/domain/intelligence/dataset";
import type { StaffMember } from "@/domain/performance/actualValue";
import { STAFF_ROLE_LABEL, type StaffRole } from "@/domain/performance/goalTypes";
import { buildRevenueRankings } from "@/domain/revenueIntelligence/rankings";
import type { FinancialBreakdownItem, FinancialMarketingIndicators } from "@/types/financial";
import type { PerformanceRankingRow, PerformanceRankings } from "@/types/performance";
import type { ConversionBreakdownRow, RankingRow } from "@/types/revenueIntelligence";

function toPerformanceRow(row: RankingRow): PerformanceRankingRow {
  return {
    label: row.label,
    value: row.revenue,
    secondaryLabel: row.secondaryLabel,
    secondaryValue: row.secondaryValue,
  };
}

/** "Top equipes" agrupa por profiles.role (não existe tabela de times),
 * somando o mesmo breakdown "revenueByOwner" já computado em
 * domain/financial/marketing.ts — único ranking genuinamente novo desta
 * fase; os outros 4 reaproveitam domain/revenueIntelligence/rankings.ts::
 * buildRevenueRankings tal qual. */
function buildTopTeams(
  revenueByOwner: FinancialBreakdownItem[],
  staff: StaffMember[],
): PerformanceRankingRow[] {
  const roleByName = new Map(staff.map((s) => [(s.name ?? s.email ?? "").toLowerCase(), s.role]));
  const totals = new Map<string, number>();

  for (const item of revenueByOwner) {
    const role = roleByName.get(item.label.toLowerCase());
    if (!role) continue;
    totals.set(role, (totals.get(role) ?? 0) + item.value);
  }

  return [...totals.entries()]
    .map(([role, revenue]) => ({
      label: STAFF_ROLE_LABEL[role as StaffRole] ?? role,
      value: revenue,
      secondaryLabel: "Receita",
      secondaryValue: null,
    }))
    .sort((a, b) => b.value - a.value);
}

export function buildPerformanceRankings(
  indicators: FinancialMarketingIndicators,
  revenueByClient: FinancialBreakdownItem[],
  ownerConversion: OwnerConversion[],
  conversionByDimension: {
    vendedor: ConversionBreakdownRow[];
    canal: ConversionBreakdownRow[];
    cidade: ConversionBreakdownRow[];
  },
  staff: StaffMember[],
): PerformanceRankings {
  const revenueRankings = buildRevenueRankings(
    indicators,
    revenueByClient,
    ownerConversion,
    conversionByDimension,
  );

  return {
    topSellers: revenueRankings.topSellers.map(toPerformanceRow),
    topCampaigns: revenueRankings.topCampaigns.map(toPerformanceRow),
    topChannels: revenueRankings.topChannels.map(toPerformanceRow),
    topCities: revenueRankings.topCities.map(toPerformanceRow),
    topTeams: buildTopTeams(indicators.revenueByOwner, staff),
  };
}
