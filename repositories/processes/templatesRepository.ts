import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ProcessCategoryColor,
  ProcessTemplate,
  ProcessTemplateStepBlueprint,
} from "@/types/processes";

interface TemplateRow {
  id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  default_estimated_minutes: number | null;
  steps_blueprint: ProcessTemplateStepBlueprint[];
  is_default: boolean;
  created_at: string;
  category?: { name: string; color: ProcessCategoryColor } | null;
}

const TEMPLATE_SELECT = `
  id, name, description, category_id, default_estimated_minutes, steps_blueprint, is_default, created_at,
  category:crm_process_categories!crm_process_templates_category_id_fkey(name, color)
`;

function mapTemplate(row: TemplateRow): ProcessTemplate {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    categoryId: row.category_id,
    categoryName: row.category?.name ?? null,
    categoryColor: row.category?.color ?? null,
    defaultEstimatedMinutes: row.default_estimated_minutes,
    stepsBlueprint: row.steps_blueprint ?? [],
    isDefault: row.is_default,
    createdAt: row.created_at,
  };
}

export async function listTemplates(supabase: SupabaseClient): Promise<ProcessTemplate[]> {
  const { data, error } = await supabase
    .from("crm_process_templates")
    .select(TEMPLATE_SELECT)
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) throw new Error(`Falha ao carregar templates: ${error.message}`);
  return ((data ?? []) as unknown as TemplateRow[]).map(mapTemplate);
}

export async function getTemplateById(
  supabase: SupabaseClient,
  id: string,
): Promise<ProcessTemplate | null> {
  const { data, error } = await supabase
    .from("crm_process_templates")
    .select(TEMPLATE_SELECT)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw new Error(`Falha ao carregar template: ${error.message}`);
  return data ? mapTemplate(data as unknown as TemplateRow) : null;
}

export interface CreateTemplatePayload {
  name: string;
  description: string | null;
  categoryId: string | null;
  defaultEstimatedMinutes: number | null;
  stepsBlueprint: ProcessTemplateStepBlueprint[];
  createdBy: string | null;
}

export async function createTemplate(
  supabase: SupabaseClient,
  payload: CreateTemplatePayload,
): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from("crm_process_templates")
    .insert({
      name: payload.name,
      description: payload.description,
      category_id: payload.categoryId,
      default_estimated_minutes: payload.defaultEstimatedMinutes,
      steps_blueprint: payload.stepsBlueprint,
      created_by: payload.createdBy,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Falha ao criar template: ${error.message}`);
  return data as { id: string };
}

export interface UpdateTemplatePayload {
  name?: string;
  description?: string | null;
  categoryId?: string | null;
  defaultEstimatedMinutes?: number | null;
  stepsBlueprint?: ProcessTemplateStepBlueprint[];
}

export async function updateTemplate(
  supabase: SupabaseClient,
  id: string,
  patch: UpdateTemplatePayload,
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.description !== undefined) payload.description = patch.description;
  if (patch.categoryId !== undefined) payload.category_id = patch.categoryId;
  if (patch.defaultEstimatedMinutes !== undefined) {
    payload.default_estimated_minutes = patch.defaultEstimatedMinutes;
  }
  if (patch.stepsBlueprint !== undefined) payload.steps_blueprint = patch.stepsBlueprint;

  const { error } = await supabase.from("crm_process_templates").update(payload).eq("id", id);
  if (error) throw new Error(`Falha ao atualizar template: ${error.message}`);
}

/** Soft delete only — RLS já bloqueia remover templates is_default. */
export async function deleteTemplate(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase
    .from("crm_process_templates")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(`Falha ao remover template: ${error.message}`);
}
