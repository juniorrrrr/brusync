"use server";

import { revalidatePath } from "next/cache";
import { requireCrmProfile } from "@/application/crm/authGuard";
import { TEAM_GOAL_TYPE_META } from "@/domain/team/goalTypes";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { archiveTeamGoal, createTeamGoal, updateTeamGoal } from "@/services/team/teamService";
import type { TeamGoalPeriodType, TeamGoalType } from "@/types/team";

const DEMO_WRITE_BLOCKED_MESSAGE =
  "Ação indisponível em Modo Demonstração — nenhuma escrita é enviada ao banco.";

export interface TeamGoalActionState {
  status: "idle" | "success" | "error";
  message?: string;
}

function parseGoalType(value: FormDataEntryValue | null): TeamGoalType | null {
  return typeof value === "string" && value in TEAM_GOAL_TYPE_META ? (value as TeamGoalType) : null;
}

export async function createTeamGoalAction(
  _prevState: TeamGoalActionState,
  formData: FormData,
): Promise<TeamGoalActionState> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  const teamMemberId = String(formData.get("teamMemberId") ?? "").trim();
  const type = parseGoalType(formData.get("type"));
  const periodType = String(formData.get("periodType") ?? "") as TeamGoalPeriodType;
  const periodStart = String(formData.get("periodStart") ?? "").trim();
  const periodEnd = String(formData.get("periodEnd") ?? "").trim();
  const targetValue = Number(formData.get("targetValue"));
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!teamMemberId) return { status: "error", message: "Selecione o colaborador." };
  if (!type) return { status: "error", message: "Selecione o indicador da meta." };
  if (!periodStart || !periodEnd || periodStart > periodEnd) {
    return { status: "error", message: "Informe um período válido." };
  }
  if (!Number.isFinite(targetValue) || targetValue <= 0) {
    return { status: "error", message: "Informe um valor-alvo maior que zero." };
  }

  await createTeamGoal({
    teamMemberId,
    type,
    periodType,
    periodStart,
    periodEnd,
    targetValue,
    direction: TEAM_GOAL_TYPE_META[type].defaultDirection,
    notes,
    createdBy: profile.id,
  });

  revalidatePath("/equipe");
  return { status: "success", message: "Meta criada." };
}

export async function updateTeamGoalAction(
  _prevState: TeamGoalActionState,
  formData: FormData,
): Promise<TeamGoalActionState> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { status: "error", message: "Meta não encontrada." };

  const targetValue = Number(formData.get("targetValue"));
  const periodStart = String(formData.get("periodStart") ?? "").trim();
  const periodEnd = String(formData.get("periodEnd") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!Number.isFinite(targetValue) || targetValue <= 0) {
    return { status: "error", message: "Informe um valor-alvo maior que zero." };
  }
  if (!periodStart || !periodEnd || periodStart > periodEnd) {
    return { status: "error", message: "Informe um período válido." };
  }

  await updateTeamGoal(id, { targetValue, periodStart, periodEnd, notes });

  revalidatePath("/equipe");
  return { status: "success", message: "Meta atualizada." };
}

export async function archiveTeamGoalAction(id: string): Promise<TeamGoalActionState> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  await archiveTeamGoal(id);
  revalidatePath("/equipe");
  return { status: "success", message: "Meta arquivada." };
}
