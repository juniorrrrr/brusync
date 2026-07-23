import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { buildFinancialMarketingIndicators } from "@/domain/financial/marketing";
import { listMarketingLedgerRows } from "@/repositories/financial/transactionsRepository";
import { listCampaignSpend } from "@/repositories/marketing/campaignSpendRepository";
import type { FinancialMarketingIndicators } from "@/types/financial";

/** Real CAC/ROI/ROAS — revenue comes from actually-paid crm_financial
 * installments (never crm_leads.potential_value, which the existing
 * Marketing Intelligence "Executivo" page already uses as its own,
 * intentionally cruder proxy), spend from the same manually-logged
 * marketing_campaign_spend the Fase 6 module already exposes. */
export async function getFinancialMarketingIndicators(
  supabase: SupabaseClient,
): Promise<FinancialMarketingIndicators> {
  const [rows, spendEntries] = await Promise.all([
    listMarketingLedgerRows(supabase),
    listCampaignSpend(supabase),
  ]);

  const totalSpend = spendEntries.reduce((sum, entry) => sum + entry.amount, 0);
  return buildFinancialMarketingIndicators(rows, totalSpend);
}
