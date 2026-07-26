"use server";

import { revalidatePath } from "next/cache";
import { requireCrmProfile } from "@/application/crm/authGuard";
import { uploadAttachment } from "@/repositories/whatsapp/attachmentsRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import {
  assignConversationLabels,
  assignConversationOwner,
  markConversationRead,
  sendChatMessage,
  setConversationArchived,
  setConversationFavorite,
  setConversationStatus,
} from "@/services/whatsapp/whatsappChatService";
import type { WhatsappConversationStatus, WhatsappMessage } from "@/types/whatsapp";

const DEMO_WRITE_BLOCKED_MESSAGE =
  "Ação indisponível em Modo Demonstração — nenhuma escrita é enviada ao banco.";

export async function sendWhatsappMessageAction(
  conversationId: string,
  body: string,
): Promise<{ ok: boolean; message?: WhatsappMessage; error?: string }> {
  const profile = await requireCrmProfile();
  const trimmed = body.trim();
  if (!trimmed) return { ok: false, error: "Digite uma mensagem." };

  try {
    const message = await sendChatMessage({
      conversationId,
      body: trimmed,
      senderProfileId: profile.id,
    });
    revalidatePath("/whatsapp");
    return { ok: true, message };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao enviar mensagem.",
    };
  }
}

export async function toggleWhatsappFavoriteAction(
  id: string,
  favorite: boolean,
): Promise<{ ok: boolean }> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false };
  await setConversationFavorite(id, favorite);
  revalidatePath("/whatsapp");
  return { ok: true };
}

export async function toggleWhatsappArchiveAction(
  id: string,
  archived: boolean,
): Promise<{ ok: boolean }> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false };
  await setConversationArchived(id, archived);
  revalidatePath("/whatsapp");
  return { ok: true };
}

export async function setWhatsappConversationStatusAction(
  id: string,
  status: WhatsappConversationStatus,
): Promise<{ ok: boolean }> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false };
  await setConversationStatus(id, status);
  revalidatePath("/whatsapp");
  return { ok: true };
}

export async function markWhatsappConversationReadAction(id: string): Promise<{ ok: boolean }> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false };
  await markConversationRead(id);
  revalidatePath("/whatsapp");
  return { ok: true };
}

export async function assignWhatsappLabelsAction(
  id: string,
  labelIds: string[],
): Promise<{ ok: boolean }> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false };
  await assignConversationLabels(id, labelIds);
  revalidatePath("/whatsapp");
  return { ok: true };
}

export async function assignWhatsappOwnerAction(
  id: string,
  ownerId: string | null,
): Promise<{ ok: boolean }> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false };
  await assignConversationOwner(id, ownerId);
  revalidatePath("/whatsapp");
  return { ok: true };
}

export async function uploadWhatsappAttachmentAction(
  conversationId: string,
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };

  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "Nenhum arquivo enviado." };

  const supabase = await getSupabaseAuthClient();
  await uploadAttachment(supabase, { conversationId, file, uploadedBy: profile.id });
  revalidatePath("/whatsapp");
  return { ok: true };
}
