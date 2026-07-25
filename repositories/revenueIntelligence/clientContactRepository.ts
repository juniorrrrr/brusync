import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ClientWithoutContactRow } from "@/types/revenueIntelligence";

interface ClientRow {
  id: string;
  company: string;
  created_at: string;
}

interface ConversationLastMessageRow {
  client_id: string | null;
  last_message_at: string | null;
}

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

/** Único repositório genuinamente novo da Fase 22 — não existe hoje nenhuma
 * agregação de "último contato por cliente" (só por lead, via
 * crm_leads.last_interaction_at, já reaproveitado em
 * repositories/intelligence/crossModuleRepository::listStaleLeads para leads).
 * Agrega crm_conversations.last_message_at por client_id em memória, mesmo
 * padrão já usado em crossModuleRepository para agregações que o PostgREST
 * não resolve nativamente. Clientes "inativo" ficam de fora — não é esperado
 * reengajamento com quem já encerrou a relação; "em_risco" entra de
 * propósito, é exatamente o status que esta lista deveria ajudar a explicar. */
export async function listClientsWithoutRecentContact(
  supabase: SupabaseClient,
  days: number,
): Promise<ClientWithoutContactRow[]> {
  const [
    { data: clientsData, error: clientsError },
    { data: conversationsData, error: conversationsError },
  ] = await Promise.all([
    supabase.from("clients").select("id, company, created_at").in("status", ["ativo", "em_risco"]),
    supabase
      .from("crm_conversations")
      .select("client_id, last_message_at")
      .not("client_id", "is", null),
  ]);

  if (clientsError) throw new Error(`Falha ao carregar clientes: ${clientsError.message}`);
  if (conversationsError)
    throw new Error(`Falha ao carregar conversas: ${conversationsError.message}`);

  const lastMessageByClient = new Map<string, string>();
  for (const row of (conversationsData ?? []) as ConversationLastMessageRow[]) {
    if (!row.client_id || !row.last_message_at) continue;
    const current = lastMessageByClient.get(row.client_id);
    if (!current || row.last_message_at > current) {
      lastMessageByClient.set(row.client_id, row.last_message_at);
    }
  }

  return ((clientsData ?? []) as ClientRow[])
    .map((client) => {
      const lastMessageAt = lastMessageByClient.get(client.id) ?? null;
      const referenceDate = lastMessageAt ?? client.created_at;
      return {
        clientId: client.id,
        clientCompany: client.company,
        lastMessageAt,
        daysSinceContact: daysSince(referenceDate),
      };
    })
    .filter((row) => row.daysSinceContact >= days)
    .sort((a, b) => b.daysSinceContact - a.daysSinceContact);
}
