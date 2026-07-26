"use server";

import { revalidatePath } from "next/cache";
import { requireCrmProfile } from "@/application/crm/authGuard";
import { PROCESS_CATEGORY_COLORS } from "@/domain/processes/statusMeta";
import * as categoriesRepo from "@/repositories/processes/categoriesRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { ProcessCategoryColor } from "@/types/processes";

const DEMO_WRITE_BLOCKED_MESSAGE =
  "Ação indisponível em Modo Demonstração — nenhuma escrita é enviada ao banco.";

export interface CategoryActionState {
  status: "idle" | "success" | "error";
  message?: string;
}

export async function saveProcessCategoryAction(
  _prevState: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { status: "error", message: "Informe um nome para a categoria." };

  const description = String(formData.get("description") ?? "").trim();
  const icon = String(formData.get("icon") ?? "folder").trim() || "folder";
  const colorRaw = String(formData.get("color") ?? "neutral").trim();
  const color = (PROCESS_CATEGORY_COLORS as string[]).includes(colorRaw)
    ? (colorRaw as ProcessCategoryColor)
    : "neutral";

  const supabase = await getSupabaseAuthClient();

  if (id) {
    await categoriesRepo.updateCategory(supabase, id, {
      name,
      description: description || null,
      icon,
      color,
    });
    revalidatePath("/processos");
    return { status: "success", message: "Categoria atualizada." };
  }

  await categoriesRepo.createCategory(supabase, {
    name,
    description: description || null,
    icon,
    color,
    createdBy: profile.id,
  });
  revalidatePath("/processos");
  return { status: "success", message: "Categoria criada." };
}

export async function deleteProcessCategoryAction(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };

  const supabase = await getSupabaseAuthClient();
  try {
    await categoriesRepo.deleteCategory(supabase, id);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Falha ao remover categoria." };
  }
  revalidatePath("/processos");
  return { ok: true };
}
