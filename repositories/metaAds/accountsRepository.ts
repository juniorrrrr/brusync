import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { MetaAccount, MetaAccountStatus } from "@/types/metaAds";

interface AccountRow {
  id: string;
  meta_user_id: string;
  name: string | null;
  email: string | null;
  status: MetaAccountStatus;
  last_sync_at: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

const ACCOUNT_SELECT =
  "id, meta_user_id, name, email, status, last_sync_at, error, created_at, updated_at";

function mapAccount(row: AccountRow): MetaAccount {
  return {
    id: row.id,
    metaUserId: row.meta_user_id,
    name: row.name,
    email: row.email,
    status: row.status,
    lastSyncAt: row.last_sync_at,
    error: row.error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getActiveMetaAccount(supabase: SupabaseClient): Promise<MetaAccount | null> {
  const { data, error } = await supabase
    .from("meta_accounts")
    .select(ACCOUNT_SELECT)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Falha ao carregar conta do Meta Ads: ${error.message}`);
  if (!data) return null;
  return mapAccount(data as AccountRow);
}

export async function getMetaAccountById(
  supabase: SupabaseClient,
  id: string,
): Promise<MetaAccount | null> {
  const { data, error } = await supabase
    .from("meta_accounts")
    .select(ACCOUNT_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Falha ao carregar conta do Meta Ads: ${error.message}`);
  return data ? mapAccount(data as AccountRow) : null;
}

export interface UpsertMetaAccountPayload {
  metaUserId: string;
  name: string | null;
  email: string | null;
  createdBy: string | null;
}

export async function upsertMetaAccount(
  supabase: SupabaseClient,
  payload: UpsertMetaAccountPayload,
): Promise<MetaAccount> {
  const { data, error } = await supabase
    .from("meta_accounts")
    .upsert(
      {
        meta_user_id: payload.metaUserId,
        name: payload.name,
        email: payload.email,
        status: "conectado",
        error: null,
        created_by: payload.createdBy,
      },
      { onConflict: "meta_user_id" },
    )
    .select(ACCOUNT_SELECT)
    .single();

  if (error) throw new Error(`Falha ao salvar conta do Meta Ads: ${error.message}`);
  return mapAccount(data as AccountRow);
}

export async function setMetaAccountStatus(
  supabase: SupabaseClient,
  id: string,
  status: MetaAccountStatus,
  patch: { error?: string | null } = {},
): Promise<void> {
  const payload: Record<string, unknown> = { status };
  if (status === "conectado") payload.last_sync_at = new Date().toISOString();
  if (patch.error !== undefined) payload.error = patch.error;

  const { error } = await supabase.from("meta_accounts").update(payload).eq("id", id);
  if (error) throw new Error(`Falha ao atualizar status da conta: ${error.message}`);
}
