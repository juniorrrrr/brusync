import type { FinancialBreakdownItem, FinancialMarketingIndicators } from "@/types/financial";

/** Revenue row enriched with the attribution fields CAC/ROI/ROAS and the
 * breakdown-by-X panels need — built by the repository by joining a paid
 * "receita" installment back to its transaction's conversion_event_id
 * (campaign_key/utm_source/utm_medium — real ad attribution, never
 * crm_leads.origin, which is a free-text manual field) and project owner. */
export interface FinancialMarketingLedgerRow {
  amount: number;
  clientId: string | null;
  campaignKey: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  origin: string | null;
  ownerName: string | null;
  city: string | null;
}

function buildBreakdown(
  rows: FinancialMarketingLedgerRow[],
  keyFn: (row: FinancialMarketingLedgerRow) => string,
  limit = 8,
): FinancialBreakdownItem[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const key = keyFn(row);
    totals.set(key, (totals.get(key) ?? 0) + row.amount);
  }
  return [...totals.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

/** CAC/ROI/ROAS only exist when spend was manually logged in
 * marketing_campaign_spend for the period — otherwise null (rendered as
 * "—" by the UI), never a fabricated zero. Same honesty rule the existing
 * Marketing Intelligence module already documents for its own metrics. */
export function buildFinancialMarketingIndicators(
  rows: FinancialMarketingLedgerRow[],
  totalSpend: number,
): FinancialMarketingIndicators {
  const totalRevenue = rows.reduce((sum, r) => sum + r.amount, 0);
  const acquiredClients = new Set(rows.map((r) => r.clientId).filter(Boolean)).size;

  const cac = totalSpend > 0 && acquiredClients > 0 ? totalSpend / acquiredClients : null;
  const roi = totalSpend > 0 ? (totalRevenue - totalSpend) / totalSpend : null;
  const roas = totalSpend > 0 ? totalRevenue / totalSpend : null;

  return {
    cac,
    roi,
    roas,
    totalSpend,
    totalRevenue,
    revenueByCampaign: buildBreakdown(rows, (r) => r.campaignKey ?? "Sem campanha"),
    revenueByOrigin: buildBreakdown(rows, (r) => r.origin ?? "Sem origem"),
    revenueByChannel: buildBreakdown(rows, (r) => r.utmMedium ?? "Sem canal"),
    revenueByUtmSource: buildBreakdown(rows, (r) => r.utmSource ?? "Sem UTM"),
    revenueByOwner: buildBreakdown(rows, (r) => r.ownerName ?? "Sem responsável"),
    revenueByCity: buildBreakdown(rows, (r) => r.city ?? "Sem cidade"),
  };
}
