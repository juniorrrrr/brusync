import "server-only";

import { getDemoExecutions } from "@/lib/demo/mockAutomations";
import {
  type ExecutionsPage,
  type ListExecutionsOptions,
  listExecutions,
} from "@/repositories/automation/executionsRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";

export async function getAutomationHistoryPageData(
  options: ListExecutionsOptions = {},
): Promise<ExecutionsPage> {
  if (await isDemoModeActive()) {
    const { executions, total } = getDemoExecutions(options);
    return { executions, total };
  }

  const supabase = await getSupabaseAuthClient();
  return listExecutions(supabase, options);
}
