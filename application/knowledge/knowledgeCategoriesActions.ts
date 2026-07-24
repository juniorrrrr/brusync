"use server";

import { revalidatePath } from "next/cache";
import { requireCrmProfile } from "@/application/crm/authGuard";
import { KNOWLEDGE_CATEGORY_COLORS } from "@/domain/knowledge/types";
import { getDemoKnowledgeCategories } from "@/lib/demo/mockKnowledge";
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from "@/repositories/knowledge/categoriesRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { KnowledgeCategory, KnowledgeCategoryColor } from "@/types/knowledge";

const DEMO_WRITE_BLOCKED_MESSAGE =
  "Ação indisponível em Modo Demonstração — nenhuma escrita é enviada ao banco.";

export async function fetchKnowledgeCategories(): Promise<KnowledgeCategory[]> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return getDemoKnowledgeCategories();

  const supabase = await getSupabaseAuthClient();
  return listCategories(supabase);
}

export interface CategoryActionState {
  status: "idle" | "success" | "error";
  message?: string;
}

export async function saveCategoryAction(
  _prevState: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { status: "error", message: "Informe um nome para a categoria." };

  const description = String(formData.get("description") ?? "").trim();
  const icon = String(formData.get("icon") ?? "doc").trim() || "doc";
  const colorRaw = String(formData.get("color") ?? "neutral").trim();
  const color = (KNOWLEDGE_CATEGORY_COLORS as string[]).includes(colorRaw)
    ? (colorRaw as KnowledgeCategoryColor)
    : "neutral";

  const supabase = await getSupabaseAuthClient();

  if (id) {
    await updateCategory(supabase, id, { name, description: description || null, icon, color });
    revalidatePath("/base-conhecimento");
    return { status: "success", message: "Categoria atualizada." };
  }

  await createCategory(supabase, {
    name,
    description: description || null,
    icon,
    color,
    createdBy: profile.id,
  });
  revalidatePath("/base-conhecimento");
  return { status: "success", message: "Categoria criada." };
}

export async function deleteCategoryAction(id: string): Promise<{ ok: boolean; error?: string }> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };

  const supabase = await getSupabaseAuthClient();
  try {
    await deleteCategory(supabase, id);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Falha ao remover categoria." };
  }
  revalidatePath("/base-conhecimento");
  return { ok: true };
}
