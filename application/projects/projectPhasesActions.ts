"use server";

import { revalidatePath } from "next/cache";
import { requireCrmProfile } from "@/application/crm/authGuard";
import { PROJECT_PHASE_STATUSES } from "@/domain/projects/types";
import {
  createPhase,
  deletePhase,
  listPhasesForProject,
  updatePhase,
} from "@/repositories/projects/projectPhasesRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { transitionPhaseStatus } from "@/services/projects/projectStatusService";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { ProjectPhaseStatus } from "@/types/projects";

const DEMO_WRITE_BLOCKED_MESSAGE =
  "Ação indisponível em Modo Demonstração — nenhuma escrita é enviada ao banco.";

export interface PhaseActionState {
  status: "idle" | "success" | "error";
  message?: string;
}

export async function savePhaseAction(
  _prevState: PhaseActionState,
  formData: FormData,
): Promise<PhaseActionState> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  const id = String(formData.get("id") ?? "").trim();
  const projectId = String(formData.get("projectId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { status: "error", message: "Informe um nome para a etapa." };

  const dueAtRaw = String(formData.get("dueAt") ?? "").trim();
  const dueAt = dueAtRaw ? new Date(dueAtRaw).toISOString() : null;

  const supabase = await getSupabaseAuthClient();

  if (id) {
    await updatePhase(supabase, id, { name, dueAt });
  } else {
    if (!projectId) return { status: "error", message: "Projeto não informado." };
    const existing = await listPhasesForProject(supabase, projectId);
    const nextPosition = existing.length > 0 ? Math.max(...existing.map((p) => p.position)) + 1 : 0;
    await createPhase(supabase, { projectId, name, position: nextPosition, dueAt });
  }

  revalidatePath("/projetos");
  return { status: "success", message: id ? "Etapa atualizada." : "Etapa criada." };
}

export async function transitionPhaseStatusAction(
  id: string,
  status: ProjectPhaseStatus,
  currentStartedAt: string | null,
): Promise<{ ok: boolean; error?: string }> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };
  if (!PROJECT_PHASE_STATUSES.includes(status)) return { ok: false, error: "Status inválido." };

  const supabase = await getSupabaseAuthClient();
  await transitionPhaseStatus(supabase, id, status, currentStartedAt);

  revalidatePath("/projetos");
  return { ok: true };
}

export async function movePhaseAction(
  projectId: string,
  phaseId: string,
  direction: "up" | "down",
): Promise<{ ok: boolean; error?: string }> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };

  const supabase = await getSupabaseAuthClient();
  const phases = await listPhasesForProject(supabase, projectId);
  const index = phases.findIndex((p) => p.id === phaseId);
  if (index === -1) return { ok: false, error: "Etapa não encontrada." };

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= phases.length) return { ok: true };

  const current = phases[index];
  const swapWith = phases[swapIndex];

  await Promise.all([
    updatePhase(supabase, current.id, { position: swapWith.position }),
    updatePhase(supabase, swapWith.id, { position: current.position }),
  ]);

  revalidatePath("/projetos");
  return { ok: true };
}

export async function deletePhaseAction(id: string): Promise<{ ok: boolean; error?: string }> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };

  const supabase = await getSupabaseAuthClient();
  await deletePhase(supabase, id);

  revalidatePath("/projetos");
  return { ok: true };
}
