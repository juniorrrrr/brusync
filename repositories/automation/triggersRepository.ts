import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AutomationTriggerType } from "@/types/automation";

export interface WorkflowTriggerBinding {
  workflowId: string;
  triggerConfig: Record<string, unknown>;
}

/** Direct query used by the scheduled "lead parado" check
 * (app/api/cron/automation-stalled-check) — only needs workflow ids and
 * each trigger's own config, not the full workflow record. */
export async function listActiveTriggerBindings(
  supabase: SupabaseClient,
  triggerType: AutomationTriggerType,
): Promise<WorkflowTriggerBinding[]> {
  const { data, error } = await supabase
    .from("automation_triggers")
    .select("workflow_id, trigger_config, workflow:automation_workflows!inner (id, status)")
    .eq("trigger_type", triggerType)
    .eq("workflow.status", "ativo");

  if (error) throw new Error(`Falha ao carregar gatilhos ativos: ${error.message}`);

  return (
    (data ?? []) as unknown as { workflow_id: string; trigger_config: Record<string, unknown> }[]
  ).map((row) => ({ workflowId: row.workflow_id, triggerConfig: row.trigger_config ?? {} }));
}
