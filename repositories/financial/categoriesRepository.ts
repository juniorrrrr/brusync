import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { FinancialCategory, FinancialCategoryKind } from "@/types/financial";

interface CategoryRow {
  id: string;
  name: string;
  kind: FinancialCategoryKind;
  is_default: boolean;
}

function mapCategory(row: CategoryRow): FinancialCategory {
  return { id: row.id, name: row.name, kind: row.kind, isDefault: row.is_default };
}

export async function listCategories(supabase: SupabaseClient): Promise<FinancialCategory[]> {
  const { data, error } = await supabase
    .from("crm_financial_categories")
    .select("id, name, kind, is_default")
    .order("name", { ascending: true });

  if (error) throw new Error(`Falha ao carregar categorias: ${error.message}`);
  return ((data ?? []) as unknown as CategoryRow[]).map(mapCategory);
}

export async function createCategory(
  supabase: SupabaseClient,
  params: { name: string; kind: FinancialCategoryKind },
): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from("crm_financial_categories")
    .insert({ name: params.name, kind: params.kind, is_default: false })
    .select("id")
    .single();

  if (error) throw new Error(`Falha ao criar categoria: ${error.message}`);
  return data as { id: string };
}

export async function deleteCategory(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("crm_financial_categories").delete().eq("id", id);
  if (error) throw new Error(`Falha ao excluir categoria: ${error.message}`);
}
