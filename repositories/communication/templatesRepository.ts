import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChannelType, MessageTemplate } from "@/types/communication";

interface TemplateRow {
  id: string;
  name: string;
  body: string;
  channel_type: ChannelType | null;
  created_at: string;
}

function mapTemplate(row: TemplateRow): MessageTemplate {
  return {
    id: row.id,
    name: row.name,
    body: row.body,
    channelType: row.channel_type,
    createdAt: row.created_at,
  };
}

const TEMPLATE_SELECT = "id, name, body, channel_type, created_at";

export async function listTemplates(supabase: SupabaseClient): Promise<MessageTemplate[]> {
  const { data, error } = await supabase
    .from("crm_message_templates")
    .select(TEMPLATE_SELECT)
    .order("name", { ascending: true });

  if (error) throw new Error(`Falha ao carregar modelos de mensagem: ${error.message}`);
  return ((data ?? []) as unknown as TemplateRow[]).map(mapTemplate);
}

export async function createTemplate(
  supabase: SupabaseClient,
  params: { name: string; body: string; channelType: ChannelType | null; createdBy: string | null },
): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from("crm_message_templates")
    .insert({
      name: params.name,
      body: params.body,
      channel_type: params.channelType,
      created_by: params.createdBy,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Falha ao criar modelo de mensagem: ${error.message}`);
  return data as { id: string };
}

export async function deleteTemplate(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("crm_message_templates").delete().eq("id", id);
  if (error) throw new Error(`Falha ao excluir modelo de mensagem: ${error.message}`);
}
