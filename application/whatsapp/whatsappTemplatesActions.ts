"use server";

import { revalidatePath } from "next/cache";
import { requireCrmProfile } from "@/application/crm/authGuard";
import { isDemoModeActive } from "@/services/demo/demoMode";
import {
  createDraftTemplate,
  removeTemplate,
  syncTemplatesFromMeta,
} from "@/services/whatsapp/whatsappTemplatesService";
import type { WhatsappTemplateCategory } from "@/types/whatsapp";

const DEMO_WRITE_BLOCKED_MESSAGE =
  "Ação indisponível em Modo Demonstração — nenhuma escrita é enviada ao banco.";

export interface WhatsappTemplateActionState {
  status: "idle" | "success" | "error";
  message?: string;
}

const INITIAL_STATE: WhatsappTemplateActionState = { status: "idle" };

export { INITIAL_STATE as WHATSAPP_TEMPLATE_ACTION_INITIAL_STATE };

export async function createWhatsappTemplateAction(
  _prevState: WhatsappTemplateActionState,
  formData: FormData,
): Promise<WhatsappTemplateActionState> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "utility") as WhatsappTemplateCategory;
  const language = String(formData.get("language") ?? "pt_BR").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!name) return { status: "error", message: "Dê um nome ao template." };
  if (!body) return { status: "error", message: "Escreva o corpo da mensagem." };

  const variables = [...body.matchAll(/\{\{(\d+)\}\}/g)].map((match) => match[1]);

  await createDraftTemplate({
    name,
    category,
    language,
    components: [{ type: "body", text: body, variables }],
  });

  revalidatePath("/whatsapp/templates");
  return { status: "success", message: "Template salvo como rascunho." };
}

export async function deleteWhatsappTemplateAction(
  id: string,
): Promise<WhatsappTemplateActionState> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  await removeTemplate(id);
  revalidatePath("/whatsapp/templates");
  return { status: "success" };
}

export async function syncWhatsappTemplatesAction(): Promise<WhatsappTemplateActionState> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  try {
    const { synced } = await syncTemplatesFromMeta();
    revalidatePath("/whatsapp/templates");
    return { status: "success", message: `${synced} template(s) sincronizado(s) da Meta.` };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Falha ao sincronizar.",
    };
  }
}
