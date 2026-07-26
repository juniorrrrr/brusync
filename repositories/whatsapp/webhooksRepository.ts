import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { WhatsappWebhookLogEntry } from "@/types/whatsapp";

export async function logWebhookEvent(
  supabase: SupabaseClient,
  params: {
    accountId: string | null;
    eventType: string;
    payload: unknown;
    processed: boolean;
    error?: string | null;
  },
): Promise<void> {
  const { error } = await supabase.from("whatsapp_webhooks").insert({
    account_id: params.accountId,
    event_type: params.eventType,
    payload: params.payload,
    processed: params.processed,
    error: params.error ?? null,
  });
  if (error) throw new Error(`Falha ao registrar log de webhook: ${error.message}`);
}

export async function listRecentWebhookLogs(
  supabase: SupabaseClient,
  limit = 50,
): Promise<WhatsappWebhookLogEntry[]> {
  const { data, error } = await supabase
    .from("whatsapp_webhooks")
    .select("id, account_id, event_type, processed, error, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Falha ao carregar logs de webhook: ${error.message}`);
  return (
    (data ?? []) as {
      id: string;
      account_id: string | null;
      event_type: string;
      processed: boolean;
      error: string | null;
      created_at: string;
    }[]
  ).map((row) => ({
    id: row.id,
    accountId: row.account_id,
    eventType: row.event_type,
    processed: row.processed,
    error: row.error,
    createdAt: row.created_at,
  }));
}
