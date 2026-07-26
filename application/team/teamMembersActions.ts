"use server";

import { revalidatePath } from "next/cache";
import { requireCrmProfile } from "@/application/crm/authGuard";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { updateTeamMember } from "@/services/team/teamService";
import type { TeamMemberStatus } from "@/types/team";

const DEMO_WRITE_BLOCKED_MESSAGE =
  "Ação indisponível em Modo Demonstração — nenhuma escrita é enviada ao banco.";

export interface TeamMemberActionState {
  status: "idle" | "success" | "error";
  message?: string;
}

const MEMBER_STATUSES: TeamMemberStatus[] = ["ativo", "ferias", "afastado", "inativo"];

export async function updateTeamMemberAction(
  _prevState: TeamMemberActionState,
  formData: FormData,
): Promise<TeamMemberActionState> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { status: "error", message: "Colaborador não encontrado." };

  const status = String(formData.get("status") ?? "") as TeamMemberStatus;
  if (!MEMBER_STATUSES.includes(status)) return { status: "error", message: "Status inválido." };

  const department = String(formData.get("department") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const entryDate = String(formData.get("entryDate") ?? "").trim() || null;
  const supervisorId = String(formData.get("supervisorId") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  await updateTeamMember(id, { status, department, phone, entryDate, supervisorId, notes });

  revalidatePath("/equipe");
  return { status: "success", message: "Colaborador atualizado." };
}
