import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { slugify } from "@/domain/knowledge/types";
import type { KnowledgeCategory, KnowledgeCategoryColor } from "@/types/knowledge";

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  color: KnowledgeCategoryColor;
  is_default: boolean;
  sort_order: number;
  created_at: string;
  documents?: { count: number }[] | null;
}

const CATEGORY_SELECT = `
  id, name, slug, description, icon, color, is_default, sort_order, created_at,
  documents:crm_knowledge_documents!crm_knowledge_documents_category_id_fkey(count)
`;

function mapCategory(row: CategoryRow): KnowledgeCategory {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    icon: row.icon,
    color: row.color,
    isDefault: row.is_default,
    sortOrder: row.sort_order,
    documentCount: row.documents?.[0]?.count ?? 0,
    createdAt: row.created_at,
  };
}

export async function listCategories(supabase: SupabaseClient): Promise<KnowledgeCategory[]> {
  const { data, error } = await supabase
    .from("crm_knowledge_categories")
    .select(CATEGORY_SELECT)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`Falha ao carregar categorias: ${error.message}`);
  return ((data ?? []) as unknown as CategoryRow[]).map(mapCategory);
}

export interface CreateCategoryPayload {
  name: string;
  description: string | null;
  icon: string;
  color: KnowledgeCategoryColor;
  createdBy: string | null;
}

export async function createCategory(
  supabase: SupabaseClient,
  payload: CreateCategoryPayload,
): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from("crm_knowledge_categories")
    .insert({
      name: payload.name,
      slug: slugify(payload.name),
      description: payload.description,
      icon: payload.icon,
      color: payload.color,
      created_by: payload.createdBy,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Falha ao criar categoria: ${error.message}`);
  return data as { id: string };
}

export interface UpdateCategoryPayload {
  name?: string;
  description?: string | null;
  icon?: string;
  color?: KnowledgeCategoryColor;
  sortOrder?: number;
}

export async function updateCategory(
  supabase: SupabaseClient,
  id: string,
  patch: UpdateCategoryPayload,
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (patch.name !== undefined) {
    payload.name = patch.name;
    payload.slug = slugify(patch.name);
  }
  if (patch.description !== undefined) payload.description = patch.description;
  if (patch.icon !== undefined) payload.icon = patch.icon;
  if (patch.color !== undefined) payload.color = patch.color;
  if (patch.sortOrder !== undefined) payload.sort_order = patch.sortOrder;

  const { error } = await supabase.from("crm_knowledge_categories").update(payload).eq("id", id);
  if (error) throw new Error(`Falha ao atualizar categoria: ${error.message}`);
}

/** Soft delete only — a category with documents still linked keeps the
 * documents' category_id intact (FK is on delete set null, but we never
 * hard-delete a category with content, only ones with zero documents). RLS
 * itself already blocks deleting is_default rows. */
export async function deleteCategory(supabase: SupabaseClient, id: string): Promise<void> {
  const { data: existing, error: fetchError } = await supabase
    .from("crm_knowledge_categories")
    .select("is_default")
    .eq("id", id)
    .maybeSingle();
  if (fetchError) throw new Error(`Falha ao verificar categoria: ${fetchError.message}`);
  if ((existing as { is_default: boolean } | null)?.is_default) {
    throw new Error("Categorias padrão não podem ser removidas.");
  }

  const { error } = await supabase
    .from("crm_knowledge_categories")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(`Falha ao remover categoria: ${error.message}`);
}
