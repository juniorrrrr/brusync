"use server";

import { requireCrmProfile } from "@/application/crm/authGuard";
import { getDemoProjectFinancialSummary } from "@/lib/demo/mockFinancial";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getProjectFinancialSummary } from "@/services/financial/financialProjectSummaryService";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";

export async function fetchProjectFinancialSummary(projectId: string) {
  await requireCrmProfile();
  if (await isDemoModeActive()) return getDemoProjectFinancialSummary(projectId);

  const supabase = await getSupabaseAuthClient();
  return getProjectFinancialSummary(supabase, projectId);
}
