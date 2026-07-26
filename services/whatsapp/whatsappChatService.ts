import "server-only";

import { randomUUID } from "node:crypto";
import { getOwnerOptions } from "@/application/crm/leadsQueries";
import {
  getDemoWhatsappConversationDetail,
  getDemoWhatsappConversations,
  getDemoWhatsappLabels,
} from "@/lib/demo/mockWhatsapp";
import { getAccountSecrets, getActiveAccount } from "@/repositories/whatsapp/accountsRepository";
import { getContactByWaId, upsertContact } from "@/repositories/whatsapp/contactsRepository";
import {
  createConversation,
  getConversationByContactId,
  getConversationById,
  type ListConversationsOptions,
  listConversations,
  setConversationLabels,
  updateConversation,
} from "@/repositories/whatsapp/conversationsRepository";
import { listLabels } from "@/repositories/whatsapp/labelsRepository";
import { createMessage, listMessages } from "@/repositories/whatsapp/messagesRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { decryptToken } from "@/services/metaConversionsApi/tokenCrypto";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import { getWhatsappProvider } from "@/services/whatsapp/whatsappProviderFactory";
import type {
  WhatsappConversation,
  WhatsappConversationDetail,
  WhatsappConversationsPageData,
  WhatsappMessage,
} from "@/types/whatsapp";

export async function getConversationsPageData(
  options: ListConversationsOptions = {},
): Promise<WhatsappConversationsPageData> {
  const [owners] = await Promise.all([getOwnerOptions()]);

  if (await isDemoModeActive()) {
    let conversations = getDemoWhatsappConversations();
    if (options.status) conversations = conversations.filter((c) => c.status === options.status);
    if (options.favoritesOnly) conversations = conversations.filter((c) => c.isFavorite);
    if (options.unreadOnly) conversations = conversations.filter((c) => c.unreadCount > 0);
    if (options.archivedOnly !== undefined) {
      conversations = conversations.filter((c) => c.isArchived === options.archivedOnly);
    } else {
      conversations = conversations.filter((c) => !c.isArchived);
    }
    if (options.ownerId) conversations = conversations.filter((c) => c.ownerId === options.ownerId);
    if (options.search) {
      const term = options.search.toLowerCase();
      conversations = conversations.filter(
        (c) =>
          (c.contact.profileName ?? "").toLowerCase().includes(term) ||
          c.contact.phoneNumber.includes(term),
      );
    }
    return { conversations, labels: getDemoWhatsappLabels(), owners };
  }

  const supabase = await getSupabaseAuthClient();
  const [conversations, labels] = await Promise.all([
    listConversations(supabase, options),
    listLabels(supabase),
  ]);
  return { conversations, labels, owners };
}

export async function getConversationDetail(
  id: string,
): Promise<WhatsappConversationDetail | null> {
  if (await isDemoModeActive()) return getDemoWhatsappConversationDetail(id);

  const supabase = await getSupabaseAuthClient();
  const conversation = await getConversationById(supabase, id);
  if (!conversation) return null;
  const messages = await listMessages(supabase, id);
  return { ...conversation, messages };
}

export interface SendChatMessageInput {
  conversationId: string;
  body: string;
  senderProfileId: string | null;
}

/** Todo envio passa pelo WhatsappProvider (nunca chama a Graph API
 * diretamente) — em Modo Demonstração o envio real é pulado (não há conta
 * de verdade para enviar), a mensagem só é devolvida para a UI otimista;
 * mesmo princípio já usado no Chat da Fase 26. */
export async function sendChatMessage(input: SendChatMessageInput): Promise<WhatsappMessage> {
  const now = new Date().toISOString();

  if (await isDemoModeActive()) {
    return {
      id: randomUUID(),
      conversationId: input.conversationId,
      direction: "outbound",
      type: "texto",
      body: input.body,
      attachment: null,
      templateName: null,
      waMessageId: `wamid.demo.${randomUUID()}`,
      status: "enviado",
      error: null,
      senderProfileId: input.senderProfileId,
      senderName: null,
      createdAt: now,
    };
  }

  const supabase = await getSupabaseAuthClient();
  const conversation = await getConversationById(supabase, input.conversationId);
  if (!conversation) throw new Error("Conversa não encontrada.");

  const account = await getActiveAccount(supabase);
  if (!account) throw new Error("Nenhuma conta do WhatsApp conectada.");

  const secrets = await getAccountSecrets(supabase, account.id);
  if (!secrets?.access_token_ciphertext || !secrets.access_token_iv) {
    throw new Error("Credenciais da conta não configuradas.");
  }

  const provider = getWhatsappProvider();
  let waMessageId: string | null = null;
  let status: WhatsappMessage["status"] = "enviado";
  let error: string | null = null;

  try {
    const result = await provider.sendTextMessage(
      {
        phoneNumberId: secrets.phone_number_id,
        wabaId: secrets.waba_id,
        accessToken: decryptToken(secrets.access_token_ciphertext, secrets.access_token_iv),
      },
      { to: conversation.contact.waId, body: input.body },
    );
    waMessageId = result.waMessageId;
  } catch (sendError) {
    status = "falhou";
    error = sendError instanceof Error ? sendError.message : "Falha ao enviar mensagem.";
  }

  const message = await createMessage(supabase, {
    conversationId: input.conversationId,
    direction: "outbound",
    type: "texto",
    body: input.body,
    waMessageId,
    status,
    senderProfileId: input.senderProfileId,
  });

  await updateConversation(supabase, input.conversationId, {
    lastMessageAt: now,
    lastMessagePreview: input.body,
  });

  return { ...message, error };
}

export async function setConversationFavorite(id: string, favorite: boolean): Promise<void> {
  if (await isDemoModeActive()) return;
  const supabase = await getSupabaseAuthClient();
  await updateConversation(supabase, id, { isFavorite: favorite });
}

export async function setConversationArchived(id: string, archived: boolean): Promise<void> {
  if (await isDemoModeActive()) return;
  const supabase = await getSupabaseAuthClient();
  await updateConversation(supabase, id, { isArchived: archived });
}

export async function setConversationStatus(
  id: string,
  status: WhatsappConversation["status"],
): Promise<void> {
  if (await isDemoModeActive()) return;
  const supabase = await getSupabaseAuthClient();
  await updateConversation(supabase, id, { status });
}

export async function markConversationRead(id: string): Promise<void> {
  if (await isDemoModeActive()) return;
  const supabase = await getSupabaseAuthClient();
  await updateConversation(supabase, id, { unreadCount: 0 });
}

export async function assignConversationLabels(id: string, labelIds: string[]): Promise<void> {
  if (await isDemoModeActive()) return;
  const supabase = await getSupabaseAuthClient();
  await setConversationLabels(supabase, id, labelIds);
}

export async function assignConversationOwner(id: string, ownerId: string | null): Promise<void> {
  if (await isDemoModeActive()) return;
  const supabase = await getSupabaseAuthClient();
  await updateConversation(supabase, id, { ownerId });
}

/** Encontra (ou cria) a conversa de um contato — usado pelo webhook ao
 * receber a primeira mensagem de um novo número. */
export async function findOrCreateConversationForContact(
  accountId: string,
  waId: string,
  profileName: string | null,
  phoneNumber: string,
): Promise<{ conversationId: string; contactId: string }> {
  const supabase = await getSupabaseAuthClient();
  let contact = await getContactByWaId(supabase, accountId, waId);
  if (!contact) {
    contact = await upsertContact(supabase, { accountId, waId, profileName, phoneNumber });
  }

  let conversation = await getConversationByContactId(supabase, contact.id);
  if (!conversation) {
    conversation = await createConversation(supabase, accountId, contact.id);
  }

  return { conversationId: conversation.id, contactId: contact.id };
}
