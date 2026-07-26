import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { MetaAdAccount } from "@/types/metaAds";

interface AdAccountRow {
  id: string;
  account_id: string;
  business_id: string | null;
  business: { name: string } | { name: string }[] | null;
  meta_ad_account_id: string;
  name: string;
  currency: string;
  timezone_name: string | null;
  account_status: string | null;
  client_id: string | null;
  client: { company: string } | { company: string }[] | null;
  responsible_id: string | null;
  responsible: { name: string | null } | { name: string | null }[] | null;
  created_at: string;
  updated_at: string;
}

const AD_ACCOUNT_SELECT = `
  id, account_id, business_id, meta_ad_account_id, name, currency, timezone_name,
  account_status, client_id, responsible_id, created_at, updated_at,
  business:meta_businesses(name),
  client:clients(company),
  responsible:profiles!meta_ad_accounts_responsible_id_fkey(name)
`;

function first<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function mapAdAccount(row: AdAccountRow): MetaAdAccount {
  const business = first(row.business);
  const client = first(row.client);
  const responsible = first(row.responsible);

  return {
    id: row.id,
    accountId: row.account_id,
    businessId: row.business_id,
    businessName: business?.name ?? null,
    metaAdAccountId: row.meta_ad_account_id,
    name: row.name,
    currency: row.currency,
    timezoneName: row.timezone_name,
    accountStatus: row.account_status,
    clientId: row.client_id,
    clientCompany: client?.company ?? null,
    responsibleId: row.responsible_id,
    responsibleName: responsible?.name ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listAdAccounts(
  supabase: SupabaseClient,
  accountId?: string,
): Promise<MetaAdAccount[]> {
  let query = supabase.from("meta_ad_accounts").select(AD_ACCOUNT_SELECT);
  if (accountId) query = query.eq("account_id", accountId);

  const { data, error } = await query.order("name");
  if (error) throw new Error(`Falha ao carregar contas de anúncios: ${error.message}`);
  return ((data ?? []) as unknown as AdAccountRow[]).map(mapAdAccount);
}

export async function getAdAccountById(
  supabase: SupabaseClient,
  id: string,
): Promise<MetaAdAccount | null> {
  const { data, error } = await supabase
    .from("meta_ad_accounts")
    .select(AD_ACCOUNT_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Falha ao carregar conta de anúncios: ${error.message}`);
  return data ? mapAdAccount(data as unknown as AdAccountRow) : null;
}

export interface UpsertAdAccountRow {
  metaAdAccountId: string;
  businessId: string | null;
  name: string;
  currency: string;
  timezoneName: string | null;
  accountStatus: string | null;
}

export async function upsertAdAccounts(
  supabase: SupabaseClient,
  accountId: string,
  rows: UpsertAdAccountRow[],
): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await supabase.from("meta_ad_accounts").upsert(
    rows.map((r) => ({
      account_id: accountId,
      business_id: r.businessId,
      meta_ad_account_id: r.metaAdAccountId,
      name: r.name,
      currency: r.currency,
      timezone_name: r.timezoneName,
      account_status: r.accountStatus,
    })),
    { onConflict: "meta_ad_account_id" },
  );

  if (error) throw new Error(`Falha ao sincronizar contas de anúncios: ${error.message}`);
}

export async function linkAdAccountToClient(
  supabase: SupabaseClient,
  id: string,
  clientId: string | null,
  responsibleId: string | null,
): Promise<void> {
  const { error } = await supabase
    .from("meta_ad_accounts")
    .update({ client_id: clientId, responsible_id: responsibleId })
    .eq("id", id);

  if (error) throw new Error(`Falha ao vincular conta de anúncios ao CRM: ${error.message}`);
}
