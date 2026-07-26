"use server";

import { revalidatePath } from "next/cache";
import { requireCrmProfile } from "@/application/crm/authGuard";
import { createAiPrompt, deleteAiPrompt } from "@/services/ai/aiChatService";
import { isDemoModeActive } from "@/services/demo/demoMode";

const DEMO_WRITE_BLOCKED_MESSAGE =
  "Ação indisponível em Modo Demonstração — nenhuma escrita é enviada ao banco.";

export interface AiPromptActionState {
  status: "idle" | "success" | "error";
  message?: string;
}

export async function createAiPromptAction(
  _prevState: AiPromptActionState,
  formData: FormData,
): Promise<AiPromptActionState> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim() || null;

  if (!title) return { status: "error", message: "Dê um título ao prompt." };
  if (!content) return { status: "error", message: "Escreva o conteúdo do prompt." };

  await createAiPrompt({ title, content, category, createdBy: profile.id });
  revalidatePath("/ia");
  return { status: "success", message: "Prompt salvo." };
}

export async function deleteAiPromptAction(id: string): Promise<AiPromptActionState> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  await deleteAiPrompt(id);
  revalidatePath("/ia");
  return { status: "success", message: "Prompt removido." };
}
