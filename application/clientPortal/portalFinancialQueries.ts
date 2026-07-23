import "server-only";

import { getDemoProjectFinancialSummary } from "@/lib/demo/mockFinancial";
import { requirePortalAccess } from "@/services/clientPortal/portalAccessService";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getProjectFinancialSummary } from "@/services/financial/financialProjectSummaryService";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { ProjectFinancialSummary } from "@/types/financial";

/** Portal-scoped financial summary for a single project — RLS already
 * restricts crm_financial_transactions reads to kind="receita" AND the
 * portal user's own client_id (Fase 14 migration), so the query itself is
 * exactly the staff one; a client never sees despesas or another client's
 * figures either way. */
export async function fetchPortalProjectFinancialSummary(
  projectId: string,
): Promise<ProjectFinancialSummary> {
  await requirePortalAccess();
  if (await isDemoModeActive()) return getDemoProjectFinancialSummary(projectId);

  const supabase = await getSupabaseAuthClient();
  return getProjectFinancialSummary(supabase, projectId);
}
