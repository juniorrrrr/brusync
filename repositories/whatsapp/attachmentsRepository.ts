import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { WhatsappAttachment, WhatsappAttachmentKind } from "@/types/whatsapp";

export const WHATSAPP_ATTACHMENTS_BUCKET = "crm-whatsapp-attachments";

interface AttachmentRow {
  id: string;
  created_at: string;
  conversation_id: string | null;
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  file_size: number | null;
  kind: WhatsappAttachmentKind;
}

const ATTACHMENT_SELECT =
  "id, created_at, conversation_id, storage_path, file_name, mime_type, file_size, kind";

function mapAttachment(row: AttachmentRow): WhatsappAttachment {
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

function kindFromMimeType(mimeType: string): WhatsappAttachmentKind {
  if (mimeType.startsWith("image/")) return "imagem";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  return "documento";
}

export async function uploadAttachment(
  supabase: SupabaseClient,
  params: { conversationId: string; file: File; uploadedBy: string },
): Promise<WhatsappAttachment> {
  const { conversationId, file, uploadedBy } = params;
  const storagePath = `${conversationId}/${crypto.randomUUID()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from(WHATSAPP_ATTACHMENTS_BUCKET)
    .upload(storagePath, file, { contentType: file.type || undefined });
  if (uploadError) throw new Error(`Falha ao enviar anexo: ${uploadError.message}`);

  const { data, error } = await supabase
    .from("whatsapp_attachments")
    .insert({
      conversation_id: conversationId,
      storage_path: storagePath,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type || null,
      kind: kindFromMimeType(file.type || ""),
      uploaded_by: uploadedBy,
    })
    .select(ATTACHMENT_SELECT)
    .single();

  if (error) {
    await supabase.storage.from(WHATSAPP_ATTACHMENTS_BUCKET).remove([storagePath]);
    throw new Error(`Falha ao salvar metadados do anexo: ${error.message}`);
  }

  return mapAttachment(data as AttachmentRow);
}

export async function getAttachmentSignedUrl(
  supabase: SupabaseClient,
  storagePath: string,
  expiresInSeconds = 300,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(WHATSAPP_ATTACHMENTS_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data) throw new Error(`Falha ao gerar link do anexo: ${error?.message}`);
  return data.signedUrl;
}

export async function getAttachmentById(
  supabase: SupabaseClient,
  id: string,
): Promise<WhatsappAttachment | null> {
  const { data, error } = await supabase
    .from("whatsapp_attachments")
    .select(ATTACHMENT_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Falha ao carregar anexo: ${error.message}`);
  if (!data) return null;
  return mapAttachment(data as AttachmentRow);
}
