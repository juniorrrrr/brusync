import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { GoogleAdsAccount, GoogleAdsConnectionStatus } from "@/types/googleAds";

interface AccountRow {
  id: string;
  customer_id: string;
  descriptive_name: string | null;
  currency_code: string | null;
  time_zone: string | null;
  is_manager: boolean;
  is_synced: boolean;
  status: GoogleAdsConnectionStatus;
  last_sync_at: string | null;
  error: string | null;
  client_id: string | null;
  responsible_id: string | null;
  created_at: string;
  updated_at: string;
}

const ACCOUNT_SELECT =
  "id, customer_id, descriptive_name, currency_code, time_zone, is_manager, is_synced, status, last_sync_at, error, client_id, responsible_id, created_at, updated_at";

function mapAccount(row: AccountRow): GoogleAdsAccount {
  return {
    id: row.id,
    customerId: row.customer_id,
    descriptiveName: row.descriptive_name,
    currencyCode: row.currency_code,
    timeZone: row.time_zone,
    isManager: row.is_manager,
    isSynced: row.is_synced,
    status: row.status,
    lastSyncAt: row.last_sync_at,
    error: row.error,
    clientId: row.client_id,
    responsibleId: row.responsible_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getSyncedGoogleAdsAccount(
  supabase: SupabaseClient,
): Promise<GoogleAdsAccount | null> {
  const { data, error } = await supabase
    .from("google_ads_accounts")
    .select(ACCOUNT_SELECT)
    .eq("is_synced", true)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Falha ao carregar conta do Google Ads: ${error.message}`);
  return data ? mapAccount(data as AccountRow) : null;
}

export async function getGoogleAdsAccountById(
  supabase: SupabaseClient,
  id: string,
): Promise<GoogleAdsAccount | null> {
  const { data, error } = await supabase
    .from("google_ads_accounts")
    .select(ACCOUNT_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Falha ao carregar conta do Google Ads: ${error.message}`);
  return data ? mapAccount(data as AccountRow) : null;
}

export async function listUnselectedGoogleAdsAccounts(
  supabase: SupabaseClient,
): Promise<GoogleAdsAccount[]> {
  const { data, error } = await supabase
    .from("google_ads_accounts")
    .select(ACCOUNT_SELECT)
    .eq("is_synced", false)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Falha ao listar contas do Google Ads: ${error.message}`);
  return ((data ?? []) as AccountRow[]).map(mapAccount);
}

export interface UpsertGoogleAdsAccountPayload {
  customerId: string;
  descriptiveName: string | null;
  currencyCode: string | null;
  timeZone: string | null;
  isManager: boolean;
  createdBy: string | null;
}

export async function upsertGoogleAdsAccount(
  supabase: SupabaseClient,
  payload: UpsertGoogleAdsAccountPayload,
): Promise<GoogleAdsAccount> {
  const { data, error } = await supabase
    .from("google_ads_accounts")
    .upsert(
      {
        customer_id: payload.customerId,
        descriptive_name: payload.descriptiveName,
        currency_code: payload.currencyCode,
        time_zone: payload.timeZone,
        is_manager: payload.isManager,
        created_by: payload.createdBy,
      },
      { onConflict: "customer_id" },
    )
    .select(ACCOUNT_SELECT)
    .single();
  if (error) throw new Error(`Falha ao salvar conta do Google Ads: ${error.message}`);
  return mapAccount(data as AccountRow);
}

/** Marca esta conta como a selecionada para sincronizar e desmarca todas as
 * demais — só uma conta ativa por vez (mesmo espírito consolidado do
 * restante da Fase 35: sem hierarquia MCC completa, um cliente escolhido
 * por vez). */
export async function selectGoogleAdsAccount(
  supabase: SupabaseClient,
  accountId: string,
): Promise<void> {
  const { error: clearError } = await supabase
    .from("google_ads_accounts")
    .update({ is_synced: false })
    .eq("is_synced", true);
  if (clearError) throw new Error(`Falha ao trocar conta selecionada: ${clearError.message}`);

  const { error } = await supabase
    .from("google_ads_accounts")
    .update({ is_synced: true, status: "conectado", last_sync_at: new Date().toISOString() })
    .eq("id", accountId);
  if (error) throw new Error(`Falha ao selecionar conta do Google Ads: ${error.message}`);
}

export async function setGoogleAdsAccountStatus(
  supabase: SupabaseClient,
  id: string,
  status: GoogleAdsConnectionStatus,
  patch: { error?: string | null } = {},
): Promise<void> {
  const row: Record<string, unknown> = { status };
  if (status === "conectado") row.last_sync_at = new Date().toISOString();
  if (patch.error !== undefined) row.error = patch.error;

  const { error } = await supabase.from("google_ads_accounts").update(row).eq("id", id);
  if (error) throw new Error(`Falha ao atualizar status da conta: ${error.message}`);
}

export async function setGoogleAdsAccountUnsynced(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("google_ads_accounts")
    .update({ is_synced: false, status: "desconectado" })
    .eq("id", id);
  if (error) throw new Error(`Falha ao desconectar conta do Google Ads: ${error.message}`);
}

export async function setGoogleAdsAccountCrmLink(
  supabase: SupabaseClient,
  id: string,
  clientId: string | null,
  responsibleId: string | null,
): Promise<void> {
  const { error } = await supabase
    .from("google_ads_accounts")
    .update({ client_id: clientId, responsible_id: responsibleId })
    .eq("id", id);
  if (error) throw new Error(`Falha ao vincular conta ao CRM: ${error.message}`);
}
