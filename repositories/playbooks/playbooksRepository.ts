import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  PlaybookCategory,
  PlaybookListFilters,
  PlaybookStatus,
  PlaybookSummary,
} from "@/types/playbooks";

interface PlaybookRow {
  id: string;
  name: string;
  description: string | null;
  category: PlaybookCategory;
  objective: string | null;
  pipeline: string | null;
  pipeline_stage_id: string | null;
  pipeline_stage_name: string | null;
  owner_id: string | null;
  status: PlaybookStatus;
  version: number;
  execution_count: number;
  updated_at: string;
  owner?: { name: string | null; email: string | null } | null;
  steps?: { status: string; estimated_minutes: number | null }[] | null;
}

const PLAYBOOK_SELECT = `
  id, name, description, category, objective, pipeline, pipeline_stage_id, pipeline_stage_name,
  owner_id, status, version, execution_count, updated_at,
  owner:profiles!crm_playbooks_owner_id_fkey(name, email),
  steps:crm_playbook_steps!crm_playbook_steps_playbook_id_fkey(status, estimated_minutes)
`;

function mapPlaybook(row: PlaybookRow): PlaybookSummary {
  const steps = row.steps ?? [];
  const minuteValues = steps
    .map((step) => step.estimated_minutes)
    .filter((value): value is number => value !== null);

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    objective: row.objective,
    pipeline: row.pipeline,
    pipelineStageId: row.pipeline_stage_id,
    pipelineStageName: row.pipeline_stage_name,
    ownerId: row.owner_id,
    ownerName: row.owner?.name ?? row.owner?.email ?? null,
    status: row.status,
    version: row.version,
    executionCount: row.execution_count,
    stepCount: steps.length,
    completedStepCount: steps.filter((step) => step.status === "concluido").length,
    pendingStepCount: steps.filter((step) => step.status !== "concluido").length,
    averageStepMinutes:
      minuteValues.length > 0
        ? Math.round(minuteValues.reduce((sum, value) => sum + value, 0) / minuteValues.length)
        : null,
    updatedAt: row.updated_at,
  };
}

export async function listPlaybooks(
  supabase: SupabaseClient,
  filters: PlaybookListFilters = {},
): Promise<{ playbooks: PlaybookSummary[]; total: number }> {
  let query = supabase
    .from("crm_playbooks")
    .select(PLAYBOOK_SELECT, { count: "exact" })
    .is("deleted_at", null);

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.stageId) query = query.eq("pipeline_stage_id", filters.stageId);
  if (filters.search) {
    const term = filters.search.replace(/[,()%]/g, " ").trim();
    if (term) query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
  }

  const { data, error, count } = await query.order("updated_at", { ascending: false }).limit(200);
  if (error) throw new Error(`Falha ao carregar playbooks: ${error.message}`);

  return {
    playbooks: ((data ?? []) as unknown as PlaybookRow[]).map(mapPlaybook),
    total: count ?? 0,
  };
}

export async function getPlaybookById(
  supabase: SupabaseClient,
  id: string,
): Promise<PlaybookSummary | null> {
  const { data, error } = await supabase
    .from("crm_playbooks")
    .select(PLAYBOOK_SELECT)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw new Error(`Falha ao carregar playbook: ${error.message}`);
  return data ? mapPlaybook(data as unknown as PlaybookRow) : null;
}

export async function getPlaybookByStage(
  supabase: SupabaseClient,
  stageId: string,
): Promise<PlaybookSummary | null> {
  const { data, error } = await supabase
    .from("crm_playbooks")
    .select(PLAYBOOK_SELECT)
    .eq("pipeline_stage_id", stageId)
    .eq("status", "ativo")
    .is("deleted_at", null)
    .order("execution_count", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Falha ao carregar playbook da etapa: ${error.message}`);
  return data ? mapPlaybook(data as unknown as PlaybookRow) : null;
}
