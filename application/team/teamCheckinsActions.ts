"use server";

import { revalidatePath } from "next/cache";
import { requireCrmProfile } from "@/application/crm/authGuard";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { createTeamCheckin, updateTeamCheckinStatus } from "@/services/team/teamService";
import type { TeamCheckinStatus, TeamCheckinType } from "@/types/team";

const DEMO_WRITE_BLOCKED_MESSAGE =
  "Ação indisponível em Modo Demonstração — nenhuma escrita é enviada ao banco.";

export interface TeamCheckinActionState {
  status: "idle" | "success" | "error";
  message?: string;
}

const CHECKIN_TYPES: TeamCheckinType[] = ["1_1", "reuniao", "avaliacao", "alinhamento"];

export async function createTeamCheckinAction(
  _prevState: TeamCheckinActionState,
  formData: FormData,
): Promise<TeamCheckinActionState> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  const teamMemberId = String(formData.get("teamMemberId") ?? "").trim();
  const type = String(formData.get("type") ?? "") as TeamCheckinType;
  const scheduledAt = String(formData.get("scheduledAt") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!teamMemberId) return { status: "error", message: "Selecione o colaborador." };
  if (!CHECKIN_TYPES.includes(type)) return { status: "error", message: "Selecione o tipo." };
  if (!scheduledAt) return { status: "error", message: "Informe data e hora." };

  await createTeamCheckin({
    teamMemberId,
    authorId: profile.id,
    type,
    scheduledAt: new Date(scheduledAt).toISOString(),
    notes,
  });

  revalidatePath("/equipe");
  return { status: "success", message: "Check-in agendado." };
}

export async function updateTeamCheckinStatusAction(
  id: string,
  status: TeamCheckinStatus,
): Promise<TeamCheckinActionState> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  await updateTeamCheckinStatus(id, status);
  revalidatePath("/equipe");
  return { status: "success", message: "Check-in atualizado." };
}
