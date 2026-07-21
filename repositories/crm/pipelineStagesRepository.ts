import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { mapPipelineStage, type PipelineStageRow } from "@/repositories/crm/mappers";
import type { PipelineStage } from "@/types/crm";

export async function listPipelineStages(supabase: SupabaseClient): Promise<PipelineStage[]> {
  const { data, error } = await supabase
    .from("pipeline_stages")
    .select("id, key, label, color, position, is_won")
    .order("position", { ascending: true });

  if (error) throw new Error(`Falha ao carregar estágios do pipeline: ${error.message}`);

  return ((data ?? []) as PipelineStageRow[]).map(mapPipelineStage);
}
