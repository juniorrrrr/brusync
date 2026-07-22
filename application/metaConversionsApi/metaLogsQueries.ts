import "server-only";

import { getDemoMetaLogs } from "@/lib/demo/mockMetaEvents";
import {
  type AttemptsPage,
  type ListMetaAttemptsOptions,
  listMetaAttempts,
} from "@/repositories/conversions/conversionDeliveryAttemptsRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";

export async function getMetaLogsPageData(
  options: ListMetaAttemptsOptions = {},
): Promise<AttemptsPage> {
  if (await isDemoModeActive()) return getDemoMetaLogs(options);

  const supabase = await getSupabaseAuthClient();
  return listMetaAttempts(supabase, options);
}
