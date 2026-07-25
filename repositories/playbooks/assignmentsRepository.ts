import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export async function listLeadPlaybookAssignments(
  supabase: SupabaseClient,
  crmLeadId: string,
): Promise<{ playbookId: string; currentStepId: string | null; assignedAt: string }[]> {
  const { data, error } = await supabase
    .from("crm_playbook_assignments")
    .select("playbook_id, current_step_id, assigned_at")
    .eq("crm_lead_id", crmLeadId)
    .order("assigned_at", { ascending: false });

  if (error) throw new Error(`Falha ao carregar atribuições de playbook: ${error.message}`);

  return (data ?? []).map((row) => ({
    playbookId: row.playbook_id,
    currentStepId: row.current_step_id,
    assignedAt: row.assigned_at,
  }));
}
