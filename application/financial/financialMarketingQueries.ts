import "server-only";

import { requireCrmProfile } from "@/application/crm/authGuard";
import { getDemoFinancialMarketingIndicators } from "@/lib/demo/mockFinancial";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getFinancialMarketingIndicators } from "@/services/financial/financialMarketingService";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";

export async function getFinancialMarketingPageData() {
  await requireCrmProfile();
  if (await isDemoModeActive()) return getDemoFinancialMarketingIndicators();

  const supabase = await getSupabaseAuthClient();
  return getFinancialMarketingIndicators(supabase);
}
