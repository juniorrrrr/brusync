import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { WhatsappContact } from "@/types/whatsapp";

interface ContactRow {
  id: string;
  created_at: string;
  account_id: string;
  wa_id: string;
  profile_name: string | null;
  phone_number: string;
  crm_lead_id: string | null;
  client_id: string | null;
  opted_in: boolean;
}

const CONTACT_SELECT =
  "id, created_at, account_id, wa_id, profile_name, phone_number, crm_lead_id, client_id, opted_in";

function mapContact(row: ContactRow): WhatsappContact {
  return {
    id: row.id,
    accountId: row.account_id,
    waId: row.wa_id,
    profileName: row.profile_name,
    phoneNumber: row.phone_number,
    crmLeadId: row.crm_lead_id,
    clientId: row.client_id,
    optedIn: row.opted_in,
    createdAt: row.created_at,
  };
}

export async function getContactByWaId(
  supabase: SupabaseClient,
  accountId: string,
  waId: string,
): Promise<WhatsappContact | null> {
  const { data, error } = await supabase
    .from("whatsapp_contacts")
    .select(CONTACT_SELECT)
    .eq("account_id", accountId)
    .eq("wa_id", waId)
    .maybeSingle();

  if (error) throw new Error(`Falha ao carregar contato: ${error.message}`);
  if (!data) return null;
  return mapContact(data as ContactRow);
}

export interface UpsertContactPayload {
  accountId: string;
  waId: string;
  profileName: string | null;
  phoneNumber: string;
}

export async function upsertContact(
  supabase: SupabaseClient,
  payload: UpsertContactPayload,
): Promise<WhatsappContact> {
  const { data, error } = await supabase
    .from("whatsapp_contacts")
    .upsert(
      {
        account_id: payload.accountId,
        wa_id: payload.waId,
        profile_name: payload.profileName,
        phone_number: payload.phoneNumber,
      },
      { onConflict: "account_id,wa_id" },
    )
    .select(CONTACT_SELECT)
    .single();

  if (error) throw new Error(`Falha ao registrar contato: ${error.message}`);
  return mapContact(data as ContactRow);
}

export async function linkContactToCrm(
  supabase: SupabaseClient,
  contactId: string,
  patch: { crmLeadId?: string | null; clientId?: string | null },
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (patch.crmLeadId !== undefined) payload.crm_lead_id = patch.crmLeadId;
  if (patch.clientId !== undefined) payload.client_id = patch.clientId;

  const { error } = await supabase.from("whatsapp_contacts").update(payload).eq("id", contactId);
  if (error) throw new Error(`Falha ao vincular contato: ${error.message}`);
}
