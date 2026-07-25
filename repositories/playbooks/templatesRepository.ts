import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlaybookTemplate } from "@/types/playbooks";

export async function listPlaybookTemplates(supabase: SupabaseClient): Promise<PlaybookTemplate[]> {
  const { data, error } = await supabase
    .from("crm_playbook_templates")
    .select("id, name, category, description, objective, steps_blueprint, is_default, created_at")
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) throw new Error(`Falha ao carregar templates de playbook: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    objective: row.objective,
    stepsBlueprint: row.steps_blueprint ?? [],
    isDefault: row.is_default,
    createdAt: row.created_at,
  })) as PlaybookTemplate[];
}
