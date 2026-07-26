import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { MetaCreative, MetaCreativeKind } from "@/types/metaAds";

interface CreativeRow {
  id: string;
  ad_account_id: string;
  meta_creative_id: string;
  name: string | null;
  kind: MetaCreativeKind;
  thumbnail_url: string | null;
  image_url: string | null;
  video_url: string | null;
  headline: string | null;
  body: string | null;
  description: string | null;
  call_to_action: string | null;
  status: string | null;
  created_at: string;
}

const CREATIVE_SELECT = `
  id, ad_account_id, meta_creative_id, name, kind, thumbnail_url, image_url, video_url,
  headline, body, description, call_to_action, status, created_at
`;

function mapCreative(row: CreativeRow): MetaCreative {
  return {
    id: row.id,
    adAccountId: row.ad_account_id,
    metaCreativeId: row.meta_creative_id,
    name: row.name,
    kind: row.kind,
    thumbnailUrl: row.thumbnail_url,
    imageUrl: row.image_url,
    videoUrl: row.video_url,
    headline: row.headline,
    body: row.body,
    description: row.description,
    callToAction: row.call_to_action,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function listCreatives(
  supabase: SupabaseClient,
  adAccountId?: string,
): Promise<MetaCreative[]> {
  let query = supabase.from("meta_creatives").select(CREATIVE_SELECT);
  if (adAccountId) query = query.eq("ad_account_id", adAccountId);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw new Error(`Falha ao carregar criativos: ${error.message}`);
  return ((data ?? []) as CreativeRow[]).map(mapCreative);
}

export interface UpsertCreativeRow {
  metaCreativeId: string;
  name: string | null;
  kind: MetaCreativeKind;
  thumbnailUrl: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  headline: string | null;
  body: string | null;
  description: string | null;
  callToAction: string | null;
  status: string | null;
}

export async function upsertCreatives(
  supabase: SupabaseClient,
  adAccountId: string,
  rows: UpsertCreativeRow[],
): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await supabase.from("meta_creatives").upsert(
    rows.map((r) => ({
      ad_account_id: adAccountId,
      meta_creative_id: r.metaCreativeId,
      name: r.name,
      kind: r.kind,
      thumbnail_url: r.thumbnailUrl,
      image_url: r.imageUrl,
      video_url: r.videoUrl,
      headline: r.headline,
      body: r.body,
      description: r.description,
      call_to_action: r.callToAction,
      status: r.status,
    })),
    { onConflict: "meta_creative_id" },
  );

  if (error) throw new Error(`Falha ao sincronizar criativos: ${error.message}`);
}

export async function getCreativeIdByMetaId(
  supabase: SupabaseClient,
  metaCreativeId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("meta_creatives")
    .select("id")
    .eq("meta_creative_id", metaCreativeId)
    .maybeSingle();

  if (error) throw new Error(`Falha ao localizar criativo: ${error.message}`);
  return data?.id ?? null;
}
