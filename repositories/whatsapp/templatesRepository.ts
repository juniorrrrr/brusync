import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  WhatsappTemplate,
  WhatsappTemplateCategory,
  WhatsappTemplateComponent,
  WhatsappTemplateStatus,
} from "@/types/whatsapp";

interface TemplateRow {
  id: string;
  created_at: string;
  updated_at: string;
  account_id: string;
  name: string;
  category: WhatsappTemplateCategory;
  language: string;
  status: WhatsappTemplateStatus;
  components: WhatsappTemplateComponent[];
  meta_template_id: string | null;
}

const TEMPLATE_SELECT =
  "id, created_at, updated_at, account_id, name, category, language, status, components, meta_template_id";

function mapTemplate(row: TemplateRow): WhatsappTemplate {
  return {
    id: row.id,
    accountId: row.account_id,
    name: row.name,
    category: row.category,
    language: row.language,
    status: row.status,
    components: row.components ?? [],
    metaTemplateId: row.meta_template_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listTemplates(
  supabase: SupabaseClient,
  accountId?: string,
): Promise<WhatsappTemplate[]> {
  let query = supabase.from("whatsapp_templates").select(TEMPLATE_SELECT);
  if (accountId) query = query.eq("account_id", accountId);
  const { data, error } = await query.order("name", { ascending: true });
  if (error) throw new Error(`Falha ao carregar templates: ${error.message}`);
  return ((data ?? []) as TemplateRow[]).map(mapTemplate);
}

export interface CreateTemplatePayload {
  accountId: string;
  name: string;
  category: WhatsappTemplateCategory;
  language: string;
  components: WhatsappTemplateComponent[];
}

export async function createTemplate(
  supabase: SupabaseClient,
  payload: CreateTemplatePayload,
): Promise<WhatsappTemplate> {
  const { data, error } = await supabase
    .from("whatsapp_templates")
    .insert({
      account_id: payload.accountId,
      name: payload.name,
      category: payload.category,
      language: payload.language,
      components: payload.components,
    })
    .select(TEMPLATE_SELECT)
    .single();

  if (error) throw new Error(`Falha ao criar template: ${error.message}`);
  return mapTemplate(data as TemplateRow);
}

export async function deleteTemplate(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("whatsapp_templates").delete().eq("id", id);
  if (error) throw new Error(`Falha ao remover template: ${error.message}`);
}

export interface UpsertRemoteTemplatePayload {
  accountId: string;
  name: string;
  category: WhatsappTemplateCategory;
  language: string;
  status: WhatsappTemplateStatus;
  components: WhatsappTemplateComponent[];
  metaTemplateId: string;
}

/** Usado pela sincronização com a Meta (services/whatsapp/
 * whatsappTemplatesService.ts::syncTemplatesFromMeta) — upsert por
 * (account_id, name, language), a mesma combinação que a Meta usa para
 * identificar um template. */
export async function upsertRemoteTemplate(
  supabase: SupabaseClient,
  payload: UpsertRemoteTemplatePayload,
): Promise<void> {
  const { error } = await supabase.from("whatsapp_templates").upsert(
    {
      account_id: payload.accountId,
      name: payload.name,
      category: payload.category,
      language: payload.language,
      status: payload.status,
      components: payload.components,
      meta_template_id: payload.metaTemplateId,
    },
    { onConflict: "account_id,name,language" },
  );
  if (error) throw new Error(`Falha ao sincronizar template: ${error.message}`);
}

export async function updateTemplateStatusByMetaId(
  supabase: SupabaseClient,
  metaTemplateId: string,
  status: WhatsappTemplateStatus,
): Promise<void> {
  const { error } = await supabase
    .from("whatsapp_templates")
    .update({ status })
    .eq("meta_template_id", metaTemplateId);
  if (error) throw new Error(`Falha ao atualizar status do template: ${error.message}`);
}
