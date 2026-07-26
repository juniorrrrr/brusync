import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  WhatsappAutomation,
  WhatsappAutomationStatus,
  WhatsappAutomationTrigger,
} from "@/types/whatsapp";

interface AutomationRow {
  id: string;
  created_at: string;
  updated_at: string;
  account_id: string;
  trigger_type: WhatsappAutomationTrigger;
  template_id: string | null;
  status: WhatsappAutomationStatus;
  config: Record<string, unknown>;
  template: { name: string } | null;
}

const AUTOMATION_SELECT = `
  id, created_at, updated_at, account_id, trigger_type, template_id, status, config,
  template:whatsapp_templates!whatsapp_automations_template_id_fkey (name)
`;

function mapAutomation(row: AutomationRow): WhatsappAutomation {
  return {
    id: row.id,
    accountId: row.account_id,
    triggerType: row.trigger_type,
    templateId: row.template_id,
    templateName: row.template?.name ?? null,
    status: row.status,
    config: row.config ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listAutomations(supabase: SupabaseClient): Promise<WhatsappAutomation[]> {
  const { data, error } = await supabase
    .from("whatsapp_automations")
    .select(AUTOMATION_SELECT)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Falha ao carregar automações: ${error.message}`);
  return ((data ?? []) as unknown as AutomationRow[]).map(mapAutomation);
}

export async function listActiveAutomationsForTrigger(
  supabase: SupabaseClient,
  triggerType: WhatsappAutomationTrigger,
): Promise<WhatsappAutomation[]> {
  const { data, error } = await supabase
    .from("whatsapp_automations")
    .select(AUTOMATION_SELECT)
    .eq("trigger_type", triggerType)
    .eq("status", "ativo");
  if (error) throw new Error(`Falha ao carregar automações do gatilho: ${error.message}`);
  return ((data ?? []) as unknown as AutomationRow[]).map(mapAutomation);
}

export interface CreateAutomationPayload {
  accountId: string;
  triggerType: WhatsappAutomationTrigger;
  templateId: string | null;
  config: Record<string, unknown>;
  createdBy: string | null;
}

export async function createAutomation(
  supabase: SupabaseClient,
  payload: CreateAutomationPayload,
): Promise<void> {
  const { error } = await supabase.from("whatsapp_automations").insert({
    account_id: payload.accountId,
    trigger_type: payload.triggerType,
    template_id: payload.templateId,
    config: payload.config,
    created_by: payload.createdBy,
  });
  if (error) throw new Error(`Falha ao criar automação: ${error.message}`);
}

export async function setAutomationStatus(
  supabase: SupabaseClient,
  id: string,
  status: WhatsappAutomationStatus,
): Promise<void> {
  const { error } = await supabase.from("whatsapp_automations").update({ status }).eq("id", id);
  if (error) throw new Error(`Falha ao atualizar automação: ${error.message}`);
}

export async function deleteAutomation(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("whatsapp_automations").delete().eq("id", id);
  if (error) throw new Error(`Falha ao remover automação: ${error.message}`);
}
