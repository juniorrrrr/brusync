import "server-only";

import { getDemoIntegrationLogs } from "@/lib/demo/mockIntegrations";
import {
  type IntegrationLogsPage,
  type ListIntegrationLogsOptions,
  listIntegrationLogs,
} from "@/repositories/integrations/integrationLogsRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";

function applyDemoFilters(options: ListIntegrationLogsOptions): IntegrationLogsPage {
  let logs = getDemoIntegrationLogs();

  if (options.status) logs = logs.filter((log) => log.status === options.status);
  if (options.provider) logs = logs.filter((log) => log.integrationProvider === options.provider);
  if (options.createdFrom)
    logs = logs.filter((log) => log.createdAt >= (options.createdFrom as string));
  if (options.createdTo)
    logs = logs.filter((log) => log.createdAt <= (options.createdTo as string));
  if (options.search) {
    const term = options.search.toLowerCase();
    logs = logs.filter(
      (log) => log.event.toLowerCase().includes(term) || log.message?.toLowerCase().includes(term),
    );
  }

  const total = logs.length;
  const limit = options.limit ?? 50;
  const offset = options.offset ?? 0;
  return { logs: logs.slice(offset, offset + limit), total };
}

export async function getIntegrationLogsPageData(
  options: ListIntegrationLogsOptions = {},
): Promise<IntegrationLogsPage> {
  if (await isDemoModeActive()) return applyDemoFilters(options);

  const supabase = await getSupabaseAuthClient();
  return listIntegrationLogs(supabase, options);
}
