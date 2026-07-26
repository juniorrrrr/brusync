"use server";

import { revalidatePath } from "next/cache";
import { requireCrmProfile } from "@/application/crm/authGuard";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { createTeamTimeOff, updateTeamTimeOffStatus } from "@/services/team/teamService";
import type { TeamTimeOffStatus, TeamTimeOffType } from "@/types/team";

const DEMO_WRITE_BLOCKED_MESSAGE =
  "Ação indisponível em Modo Demonstração — nenhuma escrita é enviada ao banco.";

export interface TeamTimeOffActionState {
  status: "idle" | "success" | "error";
  message?: string;
}

const TIME_OFF_TYPES: TeamTimeOffType[] = ["ferias", "licenca", "folga", "atestado"];

export async function createTeamTimeOffAction(
  _prevState: TeamTimeOffActionState,
  formData: FormData,
): Promise<TeamTimeOffActionState> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  const teamMemberId = String(formData.get("teamMemberId") ?? "").trim();
  const type = String(formData.get("type") ?? "") as TeamTimeOffType;
  const startDate = String(formData.get("startDate") ?? "").trim();
  const endDate = String(formData.get("endDate") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!teamMemberId) return { status: "error", message: "Selecione o colaborador." };
  if (!TIME_OFF_TYPES.includes(type)) return { status: "error", message: "Selecione o tipo." };
  if (!startDate || !endDate || startDate > endDate) {
    return { status: "error", message: "Informe um período válido." };
  }

  await createTeamTimeOff({ teamMemberId, type, startDate, endDate, notes });

  revalidatePath("/equipe");
  return { status: "success", message: "Ausência registrada." };
}

export async function updateTeamTimeOffStatusAction(
  id: string,
  status: TeamTimeOffStatus,
): Promise<TeamTimeOffActionState> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  await updateTeamTimeOffStatus(id, status);
  revalidatePath("/equipe");
  return { status: "success", message: "Ausência atualizada." };
}
