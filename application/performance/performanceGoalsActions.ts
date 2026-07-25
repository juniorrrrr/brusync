"use server";

import { revalidatePath } from "next/cache";
import { requireCrmProfile } from "@/application/crm/authGuard";
import { GOAL_TYPE_META } from "@/domain/performance/goalTypes";
import { isDemoModeActive } from "@/services/demo/demoMode";
import {
  archivePerformanceGoal,
  createPerformanceGoal,
  updatePerformanceGoal,
} from "@/services/performance/performanceService";
import type { GoalDirection, GoalPeriodType, GoalScopeType, GoalType } from "@/types/performance";

const DEMO_WRITE_BLOCKED_MESSAGE =
  "Ação indisponível em Modo Demonstração — nenhuma escrita é enviada ao banco.";

export interface GoalActionState {
  status: "idle" | "success" | "error";
  message?: string;
}

function parseGoalType(value: FormDataEntryValue | null): GoalType | null {
  return typeof value === "string" && value in GOAL_TYPE_META ? (value as GoalType) : null;
}

export async function createGoalAction(
  _prevState: GoalActionState,
  formData: FormData,
): Promise<GoalActionState> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  const type = parseGoalType(formData.get("type"));
  const scopeType = String(formData.get("scopeType") ?? "") as GoalScopeType;
  const scopeRef = String(formData.get("scopeRef") ?? "").trim() || null;
  const periodType = String(formData.get("periodType") ?? "") as GoalPeriodType;
  const periodStart = String(formData.get("periodStart") ?? "").trim();
  const periodEnd = String(formData.get("periodEnd") ?? "").trim();
  const targetValue = Number(formData.get("targetValue"));
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!type) return { status: "error", message: "Selecione o tipo de meta." };
  if (!GOAL_TYPE_META[type].validScopes.includes(scopeType)) {
    return { status: "error", message: "Escopo inválido para este tipo de meta." };
  }
  if (scopeType !== "empresa" && !scopeRef) {
    return { status: "error", message: "Selecione o alvo do escopo." };
  }
  if (!periodStart || !periodEnd || periodStart > periodEnd) {
    return { status: "error", message: "Informe um período válido." };
  }
  if (!Number.isFinite(targetValue) || targetValue <= 0) {
    return { status: "error", message: "Informe um valor-alvo maior que zero." };
  }

  const direction: GoalDirection = GOAL_TYPE_META[type].defaultDirection;

  await createPerformanceGoal({
    type,
    scopeType,
    scopeRef: scopeType === "empresa" ? null : scopeRef,
    periodType,
    periodStart,
    periodEnd,
    targetValue,
    direction,
    notes,
    createdBy: profile.id,
  });

  revalidatePath("/performance");
  return { status: "success", message: "Meta criada." };
}

export async function updateGoalAction(
  _prevState: GoalActionState,
  formData: FormData,
): Promise<GoalActionState> {
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

  await updatePerformanceGoal(id, { targetValue, periodStart, periodEnd, notes });

  revalidatePath("/performance");
  return { status: "success", message: "Meta atualizada." };
}

export async function archiveGoalAction(id: string): Promise<GoalActionState> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  await archivePerformanceGoal(id);
  revalidatePath("/performance");
  return { status: "success", message: "Meta arquivada." };
}
