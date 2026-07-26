import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { MetaBusiness } from "@/types/metaAds";

interface BusinessRow {
  id: string;
  account_id: string;
  meta_business_id: string;
  name: string;
  verification_status: string | null;
  created_at: string;
}

const BUSINESS_SELECT = "id, account_id, meta_business_id, name, verification_status, created_at";

function mapBusiness(row: BusinessRow): MetaBusiness {
  return {
    id: row.id,
    accountId: row.account_id,
    metaBusinessId: row.meta_business_id,
    name: row.name,
    verificationStatus: row.verification_status,
    createdAt: row.created_at,
  };
}

export async function listBusinesses(
  supabase: SupabaseClient,
  accountId: string,
): Promise<MetaBusiness[]> {
  const { data, error } = await supabase
    .from("meta_businesses")
    .select(BUSINESS_SELECT)
    .eq("account_id", accountId)
    .order("name");

  if (error) throw new Error(`Falha ao carregar Business Managers: ${error.message}`);
  return ((data ?? []) as BusinessRow[]).map(mapBusiness);
}

export async function upsertBusinesses(
  supabase: SupabaseClient,
  accountId: string,
  rows: { metaBusinessId: string; name: string; verificationStatus: string | null }[],
): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await supabase.from("meta_businesses").upsert(
    rows.map((r) => ({
      account_id: accountId,
      meta_business_id: r.metaBusinessId,
      name: r.name,
      verification_status: r.verificationStatus,
    })),
    { onConflict: "meta_business_id" },
  );

  if (error) throw new Error(`Falha ao sincronizar Business Managers: ${error.message}`);
}
