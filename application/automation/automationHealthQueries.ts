import "server-only";

import { getDemoAutomationHealth } from "@/lib/demo/mockAutomations";
import {
  countExecutionsToday,
  getExecutionStatsSince,
} from "@/repositories/automation/executionsRepository";
import { countActiveWorkflows } from "@/repositories/automation/workflowsRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { AutomationHealth } from "@/types/automation";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function getAutomationHealthData(): Promise<AutomationHealth> {
  if (await isDemoModeActive()) return getDemoAutomationHealth();

  const supabase = await getSupabaseAuthClient();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const recentSince = new Date(Date.now() - THIRTY_DAYS_MS).toISOString();

  const [activeWorkflows, executionsToday, statsRecent, statsToday] = await Promise.all([
    countActiveWorkflows(supabase),
    countExecutionsToday(supabase),
    getExecutionStatsSince(supabase, recentSince),
    getExecutionStatsSince(supabase, startOfDay.toISOString()),
  ]);

  const evaluated = statsRecent.success + statsRecent.failed;

  return {
    activeWorkflows,
    executionsToday,
    successRate: evaluated > 0 ? (statsRecent.success / evaluated) * 100 : null,
    averageDurationMs: statsRecent.averageDurationMs,
    failuresToday: statsToday.failed,
  };
}
