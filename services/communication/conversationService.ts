import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  type CreateConversationPayload,
  createConversation as createConversationRow,
  getConversationById,
  updateConversation,
} from "@/repositories/communication/conversationsRepository";
import { createMessageEvent } from "@/repositories/communication/eventsRepository";
import { createMessage as createMessageRow } from "@/repositories/communication/messagesRepository";
import { createActivity } from "@/repositories/crm/activitiesRepository";
import type { ConversationStatus, MessageDirection } from "@/types/communication";
import type { ActivityType } from "@/types/crm";

const PREVIEW_LENGTH = 120;

function preview(body: string): string {
  return body.length > PREVIEW_LENGTH ? `${body.slice(0, PREVIEW_LENGTH)}…` : body;
}

/** Only conversations linked to a Lead also feed the CRM's general Timeline
 * (crm_lead_activities) — a Cliente-only conversation has no equivalent
 * generic timeline in this app, same honest scope limit already accepted for
 * the Financial module's client/project summaries. */
async function logLeadActivity(
  supabase: SupabaseClient,
  crmLeadId: string | null,
  params: { type: ActivityType; title: string; body?: string },
  actorId: string | null,
): Promise<void> {
  if (!crmLeadId) return;
  await createActivity(supabase, {
    crmLeadId,
    type: params.type,
    title: params.title,
    body: params.body ?? null,
    createdBy: actorId,
  });
}

export async function createConversation(
  supabase: SupabaseClient,
  payload: CreateConversationPayload,
): Promise<{ id: string }> {
  const { id } = await createConversationRow(supabase, payload);

  await createMessageEvent(supabase, {
    conversationId: id,
    type: "conversation_started",
    actorId: payload.createdBy,
  });

  await logLeadActivity(
    supabase,
    payload.crmLeadId,
    { type: "conversation_started", title: "Conversa iniciada" },
    payload.createdBy,
  );

  return { id };
}

export interface SendMessagePayload {
  conversationId: string;
  direction: MessageDirection;
  body: string;
  senderProfileId: string | null;
  senderName: string | null;
}

/** Outbound = the staff composer ("Enviar"); inbound = manually logging a
 * message that arrived through a channel with no real integration yet
 * ("Registrar mensagem recebida") — both are first-class since Fase 15
 * doesn't call any external API either way. */
export async function sendMessage(supabase: SupabaseClient, payload: SendMessagePayload) {
  const conversation = await getConversationById(supabase, payload.conversationId);
  if (!conversation) throw new Error("Conversa não encontrada.");

  const message = await createMessageRow(supabase, payload);

  await updateConversation(supabase, payload.conversationId, {
    lastMessageAt: message.createdAt,
    lastMessagePreview: preview(message.body),
    lastMessageDirection: payload.direction,
    unreadCount: payload.direction === "inbound" ? conversation.unreadCount + 1 : 0,
    status: conversation.status === "encerrada" ? "aberta" : conversation.status,
  });

  const eventType = payload.direction === "inbound" ? "message_received" : "message_sent";
  await createMessageEvent(supabase, {
    conversationId: payload.conversationId,
    type: eventType,
    actorId: payload.senderProfileId,
  });

  await logLeadActivity(
    supabase,
    conversation.crmLeadId,
    {
      type: eventType,
      title: eventType === "message_received" ? "Mensagem recebida" : "Mensagem enviada",
      body: preview(message.body),
    },
    payload.senderProfileId,
  );

  return message;
}

export async function markConversationRead(
  supabase: SupabaseClient,
  conversationId: string,
): Promise<void> {
  await updateConversation(supabase, conversationId, { unreadCount: 0 });
}

export async function changeConversationOwner(
  supabase: SupabaseClient,
  conversationId: string,
  newOwnerId: string | null,
  actorId: string | null,
): Promise<void> {
  const conversation = await getConversationById(supabase, conversationId);
  if (!conversation) throw new Error("Conversa não encontrada.");

  await updateConversation(supabase, conversationId, { ownerId: newOwnerId });

  await createMessageEvent(supabase, {
    conversationId,
    type: "owner_changed",
    actorId,
    metadata: { previousOwnerId: conversation.ownerId, newOwnerId },
  });

  await logLeadActivity(
    supabase,
    conversation.crmLeadId,
    { type: "conversation_owner_changed", title: "Responsável da conversa alterado" },
    actorId,
  );
}

export async function setConversationStatus(
  supabase: SupabaseClient,
  conversationId: string,
  status: ConversationStatus,
  actorId: string | null,
): Promise<void> {
  await updateConversation(supabase, conversationId, { status });

  const eventType =
    status === "encerrada"
      ? "conversation_closed"
      : status === "aberta"
        ? "conversation_reopened"
        : "status_changed";

  await createMessageEvent(supabase, { conversationId, type: eventType, actorId });

  if (status === "encerrada" || status === "aberta") {
    const conversation = await getConversationById(supabase, conversationId);
    await logLeadActivity(
      supabase,
      conversation?.crmLeadId ?? null,
      {
        type: status === "encerrada" ? "conversation_closed" : "conversation_started",
        title: status === "encerrada" ? "Conversa encerrada" : "Conversa reaberta",
      },
      actorId,
    );
  }
}

export async function toggleConversationFavorite(
  supabase: SupabaseClient,
  conversationId: string,
  isFavorite: boolean,
  actorId: string | null,
): Promise<void> {
  await updateConversation(supabase, conversationId, { isFavorite });
  await createMessageEvent(supabase, {
    conversationId,
    type: isFavorite ? "favorited" : "unfavorited",
    actorId,
  });
}

export async function toggleConversationArchive(
  supabase: SupabaseClient,
  conversationId: string,
  isArchived: boolean,
  actorId: string | null,
): Promise<void> {
  await updateConversation(supabase, conversationId, { isArchived });
  await createMessageEvent(supabase, {
    conversationId,
    type: isArchived ? "archived" : "unarchived",
    actorId,
  });
}
