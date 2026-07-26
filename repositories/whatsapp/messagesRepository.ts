import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  WhatsappAttachment,
  WhatsappAttachmentKind,
  WhatsappMessage,
  WhatsappMessageDirection,
  WhatsappMessageStatus,
  WhatsappMessageType,
} from "@/types/whatsapp";

interface MessageRow {
  id: string;
  created_at: string;
  conversation_id: string;
  direction: WhatsappMessageDirection;
  type: WhatsappMessageType;
  body: string | null;
  wa_message_id: string | null;
  status: WhatsappMessageStatus;
  error: string | null;
  sender_profile_id: string | null;
  sender: { name: string | null; email: string | null } | null;
  attachment: {
    id: string;
    conversation_id: string | null;
    storage_path: string;
    file_name: string;
    mime_type: string | null;
    file_size: number | null;
    kind: WhatsappAttachmentKind;
    created_at: string;
  } | null;
  template: { name: string } | null;
}

const MESSAGE_SELECT = `
  id, created_at, conversation_id, direction, type, body, wa_message_id, status, error, sender_profile_id,
  sender:profiles!whatsapp_messages_sender_profile_id_fkey (name, email),
  attachment:whatsapp_attachments!whatsapp_messages_attachment_id_fkey (
    id, conversation_id, storage_path, file_name, mime_type, file_size, kind, created_at
  ),
  template:whatsapp_templates!whatsapp_messages_template_id_fkey (name)
`;

function mapAttachment(row: MessageRow["attachment"]): WhatsappAttachment | null {
  if (!row) return null;
  return {
    id: row.id,
    conversationId: row.conversation_id,
    storagePath: row.storage_path,
    fileName: row.file_name,
    mimeType: row.mime_type,
    fileSize: row.file_size,
    kind: row.kind,
    createdAt: row.created_at,
  };
}

function mapMessage(row: MessageRow): WhatsappMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    direction: row.direction,
    type: row.type,
    body: row.body,
    attachment: mapAttachment(row.attachment),
    templateName: row.template?.name ?? null,
    waMessageId: row.wa_message_id,
    status: row.status,
    error: row.error,
    senderProfileId: row.sender_profile_id,
    senderName: row.sender?.name ?? row.sender?.email ?? null,
    createdAt: row.created_at,
  };
}

export async function listMessages(
  supabase: SupabaseClient,
  conversationId: string,
): Promise<WhatsappMessage[]> {
  const { data, error } = await supabase
    .from("whatsapp_messages")
    .select(MESSAGE_SELECT)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Falha ao carregar mensagens: ${error.message}`);
  return ((data ?? []) as unknown as MessageRow[]).map(mapMessage);
}

export interface CreateMessagePayload {
  conversationId: string;
  direction: WhatsappMessageDirection;
  type: WhatsappMessageType;
  body?: string | null;
  attachmentId?: string | null;
  templateId?: string | null;
  waMessageId?: string | null;
  status?: WhatsappMessageStatus;
  senderProfileId?: string | null;
}

export async function createMessage(
  supabase: SupabaseClient,
  payload: CreateMessagePayload,
): Promise<WhatsappMessage> {
  const { data, error } = await supabase
    .from("whatsapp_messages")
    .insert({
      conversation_id: payload.conversationId,
      direction: payload.direction,
      type: payload.type,
      body: payload.body ?? null,
      attachment_id: payload.attachmentId ?? null,
      template_id: payload.templateId ?? null,
      wa_message_id: payload.waMessageId ?? null,
      status: payload.status ?? "pendente",
      sender_profile_id: payload.senderProfileId ?? null,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Falha ao registrar mensagem: ${error.message}`);
  const messages = await listMessages(supabase, payload.conversationId);
  const created = messages.find((m) => m.id === (data as { id: string }).id);
  if (!created) throw new Error("Mensagem criada, mas não encontrada.");
  return created;
}

export async function setMessageStatusByWaId(
  supabase: SupabaseClient,
  waMessageId: string,
  status: WhatsappMessageStatus,
  error?: string | null,
): Promise<void> {
  const payload: Record<string, unknown> = { status };
  if (error !== undefined) payload.error = error;

  const { error: updateError } = await supabase
    .from("whatsapp_messages")
    .update(payload)
    .eq("wa_message_id", waMessageId);
  if (updateError) throw new Error(`Falha ao atualizar status da mensagem: ${updateError.message}`);
}

export async function countMessagesSince(
  supabase: SupabaseClient,
  direction: WhatsappMessageDirection,
  sinceIso: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("whatsapp_messages")
    .select("*", { count: "exact", head: true })
    .eq("direction", direction)
    .gte("created_at", sinceIso);
  if (error) throw new Error(`Falha ao contar mensagens: ${error.message}`);
  return count ?? 0;
}

export async function countMessagesByStatus(
  supabase: SupabaseClient,
  status: WhatsappMessageStatus,
): Promise<number> {
  const { count, error } = await supabase
    .from("whatsapp_messages")
    .select("*", { count: "exact", head: true })
    .eq("status", status);
  if (error) throw new Error(`Falha ao contar mensagens: ${error.message}`);
  return count ?? 0;
}

export async function countTemplateMessagesSince(
  supabase: SupabaseClient,
  sinceIso: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("whatsapp_messages")
    .select("*", { count: "exact", head: true })
    .eq("type", "template")
    .gte("created_at", sinceIso);
  if (error) throw new Error(`Falha ao contar templates enviados: ${error.message}`);
  return count ?? 0;
}
