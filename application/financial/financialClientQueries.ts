"use server";

import { requireCrmProfile } from "@/application/crm/authGuard";
import { getDemoClientFinancialSummary } from "@/lib/demo/mockFinancial";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getClientFinancialSummary } from "@/services/financial/financialClientSummaryService";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";

export async function fetchClientFinancialSummary(clientId: string) {
  await requireCrmProfile();
  if (await isDemoModeActive()) return getDemoClientFinancialSummary(clientId);

  const supabase = await getSupabaseAuthClient();
  return getClientFinancialSummary(supabase, clientId);
}
