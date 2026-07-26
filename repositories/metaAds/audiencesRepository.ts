import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { MetaAudience, MetaAudienceKind } from "@/types/metaAds";

interface AudienceRow {
  id: string;
  ad_account_id: string;
  meta_audience_id: string;
  name: string;
  kind: MetaAudienceKind;
  approximate_count: number | null;
  status: string | null;
  origin: string | null;
  created_at: string;
}

const AUDIENCE_SELECT =
  "id, ad_account_id, meta_audience_id, name, kind, approximate_count, status, origin, created_at";

function mapAudience(row: AudienceRow): MetaAudience {
  return {
    id: row.id,
    adAccountId: row.ad_account_id,
    metaAudienceId: row.meta_audience_id,
    name: row.name,
    kind: row.kind,
    approximateCount: row.approximate_count,
    status: row.status,
    origin: row.origin,
    createdAt: row.created_at,
  };
}

export async function listAudiences(
  supabase: SupabaseClient,
  adAccountId?: string,
): Promise<MetaAudience[]> {
  let query = supabase.from("meta_audiences").select(AUDIENCE_SELECT);
  if (adAccountId) query = query.eq("ad_account_id", adAccountId);

  const { data, error } = await query.order("name");
  if (error) throw new Error(`Falha ao carregar públicos: ${error.message}`);
  return ((data ?? []) as AudienceRow[]).map(mapAudience);
}

export interface UpsertAudienceRow {
  metaAudienceId: string;
  name: string;
  kind: MetaAudienceKind;
  approximateCount: number | null;
  status: string | null;
  origin: string | null;
}

export async function upsertAudiences(
  supabase: SupabaseClient,
  adAccountId: string,
  rows: UpsertAudienceRow[],
): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await supabase.from("meta_audiences").upsert(
    rows.map((r) => ({
      ad_account_id: adAccountId,
      meta_audience_id: r.metaAudienceId,
      name: r.name,
      kind: r.kind,
      approximate_count: r.approximateCount,
      status: r.status,
      origin: r.origin,
    })),
    { onConflict: "meta_audience_id" },
  );

  if (error) throw new Error(`Falha ao sincronizar públicos: ${error.message}`);
}
