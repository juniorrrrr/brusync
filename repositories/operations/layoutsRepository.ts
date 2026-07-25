import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { OperationsWidgetConfig } from "@/types/operations";

export async function getLayoutForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<OperationsWidgetConfig[] | null> {
  const { data, error } = await supabase
    .from("operations_layouts")
    .select("layout")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(`Falha ao carregar layout: ${error.message}`);
  return (data as { layout: OperationsWidgetConfig[] } | null)?.layout ?? null;
}

export async function saveLayoutForUser(
  supabase: SupabaseClient,
  userId: string,
  layout: OperationsWidgetConfig[],
): Promise<void> {
  const { error } = await supabase
    .from("operations_layouts")
    .upsert({ user_id: userId, layout }, { onConflict: "user_id" });
  if (error) throw new Error(`Falha ao salvar layout: ${error.message}`);
}
