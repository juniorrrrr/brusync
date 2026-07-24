"use server";

import { revalidatePath } from "next/cache";
import { requireCrmProfile } from "@/application/crm/authGuard";
import { getDemoConversationDetail, getDemoConversations } from "@/lib/demo/mockCommunication";
import type { ListConversationsOptions } from "@/repositories/communication/conversationsRepository";
import { listConversations } from "@/repositories/communication/conversationsRepository";
import { getConversationDetail } from "@/services/communication/conversationDetailService";
import {
  changeConversationOwner,
  createConversation,
  markConversationRead,
  sendMessage,
  setConversationStatus,
  toggleConversationArchive,
  toggleConversationFavorite,
} from "@/services/communication/conversationService";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { ConversationStatus, MessageDirection } from "@/types/communication";

const DEMO_WRITE_BLOCKED_MESSAGE =
  "Ação indisponível em Modo Demonstração — nenhuma escrita é enviada ao banco.";

export async function fetchConversations(options: ListConversationsOptions = {}) {
  await requireCrmProfile();
  if (await isDemoModeActive()) return getDemoConversations(options);

  const supabase = await getSupabaseAuthClient();
  return listConversations(supabase, options);
}

export async function fetchConversationDetail(id: string) {
  await requireCrmProfile();
  if (await isDemoModeActive()) return getDemoConversationDetail(id);

  const supabase = await getSupabaseAuthClient();
  return getConversationDetail(supabase, id);
}

export interface ConversationActionState {
  status: "idle" | "success" | "error";
  message?: string;
  conversationId?: string;
}

export async function createConversationAction(
  _prevState: ConversationActionState,
  formData: FormData,
): Promise<ConversationActionState> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  const channelId = String(formData.get("channelId") ?? "").trim();
  const crmLeadId = String(formData.get("crmLeadId") ?? "").trim() || null;
  const clientId = String(formData.get("clientId") ?? "").trim() || null;
  const ownerId = String(formData.get("ownerId") ?? "").trim() || null;
  const contactName = String(formData.get("contactName") ?? "").trim() || null;
  const contactHandle = String(formData.get("contactHandle") ?? "").trim() || null;

  if (!channelId) return { status: "error", message: "Selecione um canal." };
  if (!crmLeadId && !clientId) {
    return { status: "error", message: "Selecione um Lead ou um Cliente para a conversa." };
  }

  const supabase = await getSupabaseAuthClient();
  const { id } = await createConversation(supabase, {
    channelId,
    crmLeadId,
    clientId,
    ownerId: ownerId ?? profile.id,
    contactName,
    contactHandle,
    createdBy: profile.id,
  });

  revalidatePath("/comunicacao");
  return { status: "success", message: "Conversa criada.", conversationId: id };
}

export async function sendMessageAction(
  _prevState: ConversationActionState,
  formData: FormData,
): Promise<ConversationActionState> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  const conversationId = String(formData.get("conversationId") ?? "").trim();
  const direction = String(formData.get("direction") ?? "outbound") as MessageDirection;
  const body = String(formData.get("body") ?? "").trim();

  if (!conversationId) return { status: "error", message: "Conversa inválida." };
  if (!body) return { status: "error", message: "Escreva uma mensagem." };

  const supabase = await getSupabaseAuthClient();
  await sendMessage(supabase, {
    conversationId,
    direction,
    body,
    senderProfileId: direction === "outbound" ? profile.id : null,
    senderName: direction === "outbound" ? (profile.name ?? profile.email) : null,
  });

  revalidatePath("/comunicacao");
  return { status: "success", conversationId };
}

export async function markConversationReadAction(conversationId: string): Promise<void> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return;

  const supabase = await getSupabaseAuthClient();
  await markConversationRead(supabase, conversationId);
  revalidatePath("/comunicacao");
}

export async function changeConversationOwnerAction(
  conversationId: string,
  ownerId: string | null,
): Promise<{ ok: boolean; error?: string }> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };

  const supabase = await getSupabaseAuthClient();
  await changeConversationOwner(supabase, conversationId, ownerId, profile.id);
  revalidatePath("/comunicacao");
  return { ok: true };
}

export async function setConversationStatusAction(
  conversationId: string,
  status: ConversationStatus,
): Promise<{ ok: boolean; error?: string }> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };

  const supabase = await getSupabaseAuthClient();
  await setConversationStatus(supabase, conversationId, status, profile.id);
  revalidatePath("/comunicacao");
  return { ok: true };
}

export async function toggleConversationFavoriteAction(
  conversationId: string,
  isFavorite: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };

  const supabase = await getSupabaseAuthClient();
  await toggleConversationFavorite(supabase, conversationId, isFavorite, profile.id);
  revalidatePath("/comunicacao");
  return { ok: true };
}

export async function toggleConversationArchiveAction(
  conversationId: string,
  isArchived: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };

  const supabase = await getSupabaseAuthClient();
  await toggleConversationArchive(supabase, conversationId, isArchived, profile.id);
  revalidatePath("/comunicacao");
  return { ok: true };
}
