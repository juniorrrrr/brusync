import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { WhatsappAccount, WhatsappAccountStatus } from "@/types/whatsapp";

interface AccountRow {
  id: string;
  created_at: string;
  updated_at: string;
  phone_number_id: string;
  waba_id: string;
  display_phone_number: string | null;
  display_name: string | null;
  status: WhatsappAccountStatus;
  last_sync_at: string | null;
  error: string | null;
}

const ACCOUNT_SELECT =
  "id, created_at, updated_at, phone_number_id, waba_id, display_phone_number, display_name, status, last_sync_at, error";

function mapAccount(row: AccountRow): WhatsappAccount {
  return {
    id: row.id,
    phoneNumberId: row.phone_number_id,
    wabaId: row.waba_id,
    displayPhoneNumber: row.display_phone_number,
    displayName: row.display_name,
    status: row.status,
    lastSyncAt: row.last_sync_at,
    error: row.error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getActiveAccount(supabase: SupabaseClient): Promise<WhatsappAccount | null> {
  const { data, error } = await supabase
    .from("whatsapp_accounts")
    .select(ACCOUNT_SELECT)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Falha ao carregar conta do WhatsApp: ${error.message}`);
  if (!data) return null;
  return mapAccount(data as AccountRow);
}

export async function getAccountByPhoneNumberId(
  supabase: SupabaseClient,
  phoneNumberId: string,
): Promise<WhatsappAccount | null> {
  const { data, error } = await supabase
    .from("whatsapp_accounts")
    .select(ACCOUNT_SELECT)
    .eq("phone_number_id", phoneNumberId)
    .maybeSingle();

  if (error) throw new Error(`Falha ao carregar conta do WhatsApp: ${error.message}`);
  if (!data) return null;
  return mapAccount(data as AccountRow);
}

export interface CreateOrUpdateAccountPayload {
  phoneNumberId: string;
  wabaId: string;
  accessTokenCiphertext: string;
  accessTokenIv: string;
  webhookVerifyTokenCiphertext: string;
  webhookVerifyTokenIv: string;
  appSecretCiphertext: string;
  appSecretIv: string;
  createdBy: string | null;
}

export async function upsertAccount(
  supabase: SupabaseClient,
  payload: CreateOrUpdateAccountPayload,
): Promise<WhatsappAccount> {
  const { data, error } = await supabase
    .from("whatsapp_accounts")
    .upsert(
      {
        phone_number_id: payload.phoneNumberId,
        waba_id: payload.wabaId,
        access_token_ciphertext: payload.accessTokenCiphertext,
        access_token_iv: payload.accessTokenIv,
        webhook_verify_token_ciphertext: payload.webhookVerifyTokenCiphertext,
        webhook_verify_token_iv: payload.webhookVerifyTokenIv,
        app_secret_ciphertext: payload.appSecretCiphertext,
        app_secret_iv: payload.appSecretIv,
        status: "desconectado",
        created_by: payload.createdBy,
      },
      { onConflict: "phone_number_id" },
    )
    .select(ACCOUNT_SELECT)
    .single();

  if (error) throw new Error(`Falha ao salvar conta do WhatsApp: ${error.message}`);
  return mapAccount(data as AccountRow);
}

export async function setAccountStatus(
  supabase: SupabaseClient,
  id: string,
  status: WhatsappAccountStatus,
  patch: { displayPhoneNumber?: string; displayName?: string; error?: string | null } = {},
): Promise<void> {
  const payload: Record<string, unknown> = { status };
  if (status === "conectado") payload.last_sync_at = new Date().toISOString();
  if (patch.displayPhoneNumber !== undefined)
    payload.display_phone_number = patch.displayPhoneNumber;
  if (patch.displayName !== undefined) payload.display_name = patch.displayName;
  if (patch.error !== undefined) payload.error = patch.error;

  const { error } = await supabase.from("whatsapp_accounts").update(payload).eq("id", id);
  if (error) throw new Error(`Falha ao atualizar status da conta: ${error.message}`);
}

interface AccountSecretsRow {
  access_token_ciphertext: string | null;
  access_token_iv: string | null;
  webhook_verify_token_ciphertext: string | null;
  webhook_verify_token_iv: string | null;
  app_secret_ciphertext: string | null;
  app_secret_iv: string | null;
  phone_number_id: string;
  waba_id: string;
}

export async function getAccountSecrets(
  supabase: SupabaseClient,
  accountId: string,
): Promise<AccountSecretsRow | null> {
  const { data, error } = await supabase
    .from("whatsapp_accounts")
    .select(
      "access_token_ciphertext, access_token_iv, webhook_verify_token_ciphertext, webhook_verify_token_iv, app_secret_ciphertext, app_secret_iv, phone_number_id, waba_id",
    )
    .eq("id", accountId)
    .maybeSingle();

  if (error) throw new Error(`Falha ao carregar credenciais da conta: ${error.message}`);
  return (data as AccountSecretsRow) ?? null;
}
