import "server-only";

import { getDemoConversionsHealth } from "@/lib/demo/mockConversions";
import {
  getDeliveryCountsByDestination,
  getDeliveryStatusCounts,
} from "@/repositories/conversions/conversionDeliveriesRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { ConversionsHealthSummary } from "@/types/conversions";

export async function getConversionsHealthData(): Promise<ConversionsHealthSummary> {
  if (await isDemoModeActive()) return getDemoConversionsHealth();

  const supabase = await getSupabaseAuthClient();
  const [{ count: totalEvents }, statusCounts, byDestination, originRows] = await Promise.all([
    supabase.from("conversion_events").select("*", { count: "exact", head: true }),
    getDeliveryStatusCounts(supabase),
    getDeliveryCountsByDestination(supabase),
    supabase.from("conversion_events").select("origin"),
  ]);

  const byOriginMap = new Map<string, number>();
  for (const row of (originRows.data ?? []) as { origin: string }[]) {
    byOriginMap.set(row.origin, (byOriginMap.get(row.origin) ?? 0) + 1);
  }

  return {
    totalEvents: totalEvents ?? 0,
    pendingDeliveries: statusCounts.pendente,
    sentDeliveries: statusCounts.enviado,
    failedDeliveries: statusCounts.falhou,
    byOrigin: [...byOriginMap.entries()].map(([origin, count]) => ({ origin, count })),
    byDestination,
  };
}
