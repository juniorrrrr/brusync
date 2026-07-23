import "server-only";

import { requireCrmProfile } from "@/application/crm/authGuard";
import { getDemoFinancialDashboardData } from "@/lib/demo/mockFinancial";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getFinancialDashboardData } from "@/services/financial/financialDashboardService";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";

export async function getFinancialDashboardPageData() {
  await requireCrmProfile();
  if (await isDemoModeActive()) return getDemoFinancialDashboardData();

  const supabase = await getSupabaseAuthClient();
  return getFinancialDashboardData(supabase);
}
