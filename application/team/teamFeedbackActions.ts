"use server";

import { revalidatePath } from "next/cache";
import { requireCrmProfile } from "@/application/crm/authGuard";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { createTeamFeedback, updateTeamFeedbackStatus } from "@/services/team/teamService";
import type { TeamFeedbackStatus, TeamFeedbackType } from "@/types/team";

const DEMO_WRITE_BLOCKED_MESSAGE =
  "Ação indisponível em Modo Demonstração — nenhuma escrita é enviada ao banco.";

export interface TeamFeedbackActionState {
  status: "idle" | "success" | "error";
  message?: string;
}

const FEEDBACK_TYPES: TeamFeedbackType[] = ["elogio", "construtivo", "alerta", "reconhecimento"];

export async function createTeamFeedbackAction(
  _prevState: TeamFeedbackActionState,
  formData: FormData,
): Promise<TeamFeedbackActionState> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  const recipientTeamMemberId = String(formData.get("recipientTeamMemberId") ?? "").trim();
  const type = String(formData.get("type") ?? "") as TeamFeedbackType;
  const comment = String(formData.get("comment") ?? "").trim();

  if (!recipientTeamMemberId) return { status: "error", message: "Selecione o destinatário." };
  if (!FEEDBACK_TYPES.includes(type)) return { status: "error", message: "Selecione o tipo." };
  if (!comment) return { status: "error", message: "Escreva um comentário." };

  await createTeamFeedback({
    authorId: profile.id,
    recipientTeamMemberId,
    type,
    comment,
  });

  revalidatePath("/equipe");
  return { status: "success", message: "Feedback registrado." };
}

export async function updateTeamFeedbackStatusAction(
  id: string,
  status: TeamFeedbackStatus,
): Promise<TeamFeedbackActionState> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  await updateTeamFeedbackStatus(id, status);
  revalidatePath("/equipe");
  return { status: "success", message: "Feedback atualizado." };
}
