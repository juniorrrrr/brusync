import "server-only";

import { getDemoIntegrationHealth } from "@/lib/demo/mockIntegrations";
import { getEventBusCounts } from "@/repositories/integrations/integrationEventsRepository";
import { listIntegrationLogs } from "@/repositories/integrations/integrationLogsRepository";
import { listIntegrations } from "@/repositories/integrations/integrationsRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { IntegrationHealthSummary } from "@/types/integrations";

/** Recent-log window used to compute "tempo médio" and "taxa de sucesso" —
 * an average over everything ever logged would drown out recent behavior
 * once volume grows, so this mirrors how the rest of the app favors a
 * bounded recent window (e.g. Marketing Intelligence's period filters) over
 * an all-time aggregate. */
const RECENT_LOGS_WINDOW = 200;

export async function getIntegrationHealthData(): Promise<IntegrationHealthSummary> {
  if (await isDemoModeActive()) return getDemoIntegrationHealth();

  const supabase = await getSupabaseAuthClient();
  const [integrations, eventCounts, recentLogs] = await Promise.all([
    listIntegrations(supabase),
    getEventBusCounts(supabase),
    listIntegrationLogs(supabase, { limit: RECENT_LOGS_WINDOW }),
  ]);

  const active = integrations.filter((i) => i.status === "conectado").length;
  const errored = integrations.filter((i) => i.status === "erro").length;
  const offline = integrations.length - active - errored;

  const successLogs = recentLogs.logs.filter((log) => log.status === "success");
  const lastSyncAt = integrations
    .map((i) => i.lastSync)
    .filter((value): value is string => value !== null)
    .sort()
    .at(-1);

  return {
    activeIntegrations: active,
    offlineIntegrations: offline,
    errorIntegrations: errored,
    lastSyncAt: lastSyncAt ?? null,
    eventsSent: eventCounts.total,
    eventsProcessed: eventCounts.processed,
    averageDurationMs:
      successLogs.length > 0
        ? Math.round(
            successLogs.reduce((sum, log) => sum + (log.durationMs ?? 0), 0) / successLogs.length,
          )
        : null,
    successRate:
      recentLogs.logs.length > 0 ? (successLogs.length / recentLogs.logs.length) * 100 : null,
  };
}
