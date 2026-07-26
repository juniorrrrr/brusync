"use server";

import { revalidatePath } from "next/cache";
import { requireCrmProfile } from "@/application/crm/authGuard";
import * as templatesRepo from "@/repositories/processes/templatesRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { ProcessTemplateStepBlueprint } from "@/types/processes";

const DEMO_WRITE_BLOCKED_MESSAGE =
  "Ação indisponível em Modo Demonstração — nenhuma escrita é enviada ao banco.";

export interface TemplateActionState {
  status: "idle" | "success" | "error";
  message?: string;
}

function parseStepsBlueprint(raw: string): ProcessTemplateStepBlueprint[] | null {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.map((step, position) => ({
      name: String(step.name ?? "").trim(),
      description: null,
      position,
      checklist: Array.isArray(step.checklist)
        ? step.checklist
            .map((label: unknown, itemPosition: number) => ({
              label: String(label ?? "").trim(),
              position: itemPosition,
            }))
            .filter((item: { label: string }) => item.label.length > 0)
        : [],
    }));
  } catch {
    return null;
  }
}

export async function saveProcessTemplateAction(
  _prevState: TemplateActionState,
  formData: FormData,
): Promise<TemplateActionState> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { status: "error", message: "Informe um nome para o template." };

  const description = String(formData.get("description") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim() || null;
  const defaultEstimatedMinutesRaw = String(formData.get("defaultEstimatedMinutes") ?? "").trim();
  const defaultEstimatedMinutes = defaultEstimatedMinutesRaw
    ? Number(defaultEstimatedMinutesRaw)
    : null;

  const stepsBlueprint = parseStepsBlueprint(String(formData.get("stepsBlueprint") ?? "[]"));
  if (!stepsBlueprint) return { status: "error", message: "Etapas do template inválidas." };
  if (stepsBlueprint.some((step) => !step.name)) {
    return { status: "error", message: "Toda etapa precisa de um nome." };
  }

  const supabase = await getSupabaseAuthClient();

  if (id) {
    await templatesRepo.updateTemplate(supabase, id, {
      name,
      description: description || null,
      categoryId,
      defaultEstimatedMinutes,
      stepsBlueprint,
    });
    revalidatePath("/processos/templates");
    return { status: "success", message: "Template atualizado." };
  }

  await templatesRepo.createTemplate(supabase, {
    name,
    description: description || null,
    categoryId,
    defaultEstimatedMinutes,
    stepsBlueprint,
    createdBy: profile.id,
  });
  revalidatePath("/processos/templates");
  return { status: "success", message: "Template criado." };
}

export async function deleteProcessTemplateAction(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };

  const supabase = await getSupabaseAuthClient();
  try {
    await templatesRepo.deleteTemplate(supabase, id);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Falha ao remover template." };
  }
  revalidatePath("/processos/templates");
  return { ok: true };
}
