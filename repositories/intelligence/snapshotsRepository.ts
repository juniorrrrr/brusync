import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export async function upsertSnapshot(
  supabase: SupabaseClient,
  snapshotDate: string,
  metrics: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabase
    .from("intelligence_snapshots")
    .upsert({ snapshot_date: snapshotDate, metrics }, { onConflict: "snapshot_date" });
  if (error) throw new Error(`Falha ao salvar snapshot: ${error.message}`);
}

export async function getSnapshot(
  supabase: SupabaseClient,
  snapshotDate: string,
): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase
    .from("intelligence_snapshots")
    .select("metrics")
    .eq("snapshot_date", snapshotDate)
    .maybeSingle();

  if (error) throw new Error(`Falha ao carregar snapshot: ${error.message}`);
  return (data as { metrics: Record<string, unknown> } | null)?.metrics ?? null;
}

export async function getLatestSnapshotBefore(
  supabase: SupabaseClient,
  beforeDate: string,
): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase
    .from("intelligence_snapshots")
    .select("metrics")
    .lt("snapshot_date", beforeDate)
    .order("snapshot_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Falha ao carregar snapshot anterior: ${error.message}`);
  return (data as { metrics: Record<string, unknown> } | null)?.metrics ?? null;
}
