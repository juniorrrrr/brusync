"use server";

import { revalidatePath } from "next/cache";
import { requireCrmProfile } from "@/application/crm/authGuard";
import { isDemoModeActive } from "@/services/demo/demoMode";
import {
  createWhatsappAutomation,
  removeWhatsappAutomation,
  toggleWhatsappAutomation,
} from "@/services/whatsapp/whatsappAutomationService";
import type { WhatsappAutomationTrigger } from "@/types/whatsapp";

const DEMO_WRITE_BLOCKED_MESSAGE =
  "Ação indisponível em Modo Demonstração — nenhuma escrita é enviada ao banco.";

export interface WhatsappAutomationActionState {
  status: "idle" | "success" | "error";
  message?: string;
}

const INITIAL_STATE: WhatsappAutomationActionState = { status: "idle" };

export { INITIAL_STATE as WHATSAPP_AUTOMATION_ACTION_INITIAL_STATE };

export async function createWhatsappAutomationAction(
  _prevState: WhatsappAutomationActionState,
  formData: FormData,
): Promise<WhatsappAutomationActionState> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  const triggerType = String(formData.get("triggerType") ?? "") as WhatsappAutomationTrigger;
  const templateId = String(formData.get("templateId") ?? "").trim() || null;
  if (!triggerType) return { status: "error", message: "Selecione o gatilho." };

  try {
    await createWhatsappAutomation({ triggerType, templateId, createdBy: profile.id });
    revalidatePath("/whatsapp/automacoes");
    return { status: "success", message: "Automação criada." };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Falha ao criar automação.",
    };
  }
}

export async function toggleWhatsappAutomationAction(
  id: string,
  active: boolean,
): Promise<WhatsappAutomationActionState> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  await toggleWhatsappAutomation(id, active);
  revalidatePath("/whatsapp/automacoes");
  return { status: "success" };
}

export async function deleteWhatsappAutomationAction(
  id: string,
): Promise<WhatsappAutomationActionState> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  await removeWhatsappAutomation(id);
  revalidatePath("/whatsapp/automacoes");
  return { status: "success" };
}
