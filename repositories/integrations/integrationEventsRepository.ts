import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export interface EventBusCounts {
  total: number;
  processed: number;
  pending: number;
  failed: number;
}

/** Powers the Saúde dashboard's "eventos enviados" / "eventos processados".
 * Nothing processes events yet in this phase, so `processed`/`failed` are
 * expected to read 0 until a real dispatcher exists — see Fase 6 report. */
export async function getEventBusCounts(supabase: SupabaseClient): Promise<EventBusCounts> {
  const [{ count: total }, { count: processed }, { count: pending }, { count: failed }] =
    await Promise.all([
      supabase.from("integration_events").select("*", { count: "exact", head: true }),
      supabase
        .from("integration_events")
        .select("*", { count: "exact", head: true })
        .eq("status", "processed"),
      supabase
        .from("integration_events")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("integration_events")
        .select("*", { count: "exact", head: true })
        .eq("status", "failed"),
    ]);

  return {
    total: total ?? 0,
    processed: processed ?? 0,
    pending: pending ?? 0,
    failed: failed ?? 0,
  };
}
