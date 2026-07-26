import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AiContextType, AiUsageActionType } from "@/types/ai";

export interface LogUsagePayload {
  actionType: AiUsageActionType;
  module: AiContextType;
  createdBy: string | null;
}

export async function logUsage(supabase: SupabaseClient, payload: LogUsagePayload): Promise<void> {
  const { error } = await supabase.from("ai_usage").insert({
    action_type: payload.actionType,
    module: payload.module,
    created_by: payload.createdBy,
  });
  if (error) throw new Error(`Falha ao registrar uso: ${error.message}`);
}

export async function countUsageSince(supabase: SupabaseClient, sinceIso: string): Promise<number> {
  const { count, error } = await supabase
    .from("ai_usage")
    .select("*", { count: "exact", head: true })
    .gte("created_at", sinceIso);
  if (error) throw new Error(`Falha ao contar uso: ${error.message}`);
  return count ?? 0;
}
