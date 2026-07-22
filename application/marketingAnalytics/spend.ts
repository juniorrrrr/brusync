import "server-only";

import { sumInvestment } from "@/domain/marketing/metrics";
import { classifyMarketingOrigin } from "@/domain/marketing/originRules";
import { listCampaignSpend } from "@/repositories/marketing/campaignSpendRepository";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { MarketingOrigin, Metric } from "@/types/marketing";

/** Total manually-entered investment whose period_month falls inside the
 * given date range, optionally narrowed to one origin bucket or a campaign
 * name search — mirrors the same origin classification used for leads so
 * the Executive dashboard's investment figure stays consistent with
 * whatever "Filtros Globais" scope is active. */
export async function getTotalInvestment(
  createdFrom?: string,
  createdTo?: string,
  origin?: MarketingOrigin,
  campaignSearch?: string,
): Promise<Metric> {
  const supabase = await getSupabaseAuthClient();
  let entries = await listCampaignSpend(supabase, { periodFrom: createdFrom, periodTo: createdTo });

  if (origin) {
    entries = entries.filter(
      (entry) =>
        classifyMarketingOrigin({
          utmSource: entry.utmSource,
          utmMedium: null,
          referer: null,
          gclid: null,
          fbclid: null,
          msclkid: null,
          ttclid: null,
          manualOrigin: null,
        }) === origin,
    );
  }
  const term = campaignSearch?.trim().toLowerCase();
  if (term) {
    entries = entries.filter((entry) => entry.utmCampaign.toLowerCase().includes(term));
  }

  if (entries.length === 0) return { value: null, available: false };
  return sumInvestment(entries.map((entry) => ({ value: entry.amount, available: true })));
}
