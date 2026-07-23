import "server-only";

import { getDemoLogs } from "@/lib/demo/mockAutomations";
import {
  type ListLogsOptions,
  type LogsPage,
  listLogs,
} from "@/repositories/automation/logsRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";

export async function getAutomationLogsPageData(options: ListLogsOptions = {}): Promise<LogsPage> {
  if (await isDemoModeActive()) {
    const { logs, total } = getDemoLogs(options);
    return { logs, total };
  }

  const supabase = await getSupabaseAuthClient();
  return listLogs(supabase, options);
}
