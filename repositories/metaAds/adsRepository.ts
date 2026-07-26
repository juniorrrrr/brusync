import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { MetaAd, MetaCampaignStatus, MetaCreative, MetaCreativeKind } from "@/types/metaAds";

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

interface AdRow {
  id: string;
  ad_set_id: string;
  creative_id: string | null;
  creative: CreativeRow | CreativeRow[] | null;
  meta_ad_id: string;
  name: string;
  status: MetaCampaignStatus;
  effective_status: string | null;
  created_at: string;
  updated_at: string;
}

const AD_SELECT = `
  id, ad_set_id, creative_id, meta_ad_id, name, status, effective_status, created_at, updated_at,
  creative:meta_creatives(
    id, ad_account_id, meta_creative_id, name, kind, thumbnail_url, image_url, video_url,
    headline, body, description, call_to_action, status, created_at
  )
`;

function first<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

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

function mapAd(row: AdRow): MetaAd {
  const creative = first(row.creative);
  return {
    id: row.id,
    adSetId: row.ad_set_id,
    creativeId: row.creative_id,
    creative: creative ? mapCreative(creative) : null,
    metaAdId: row.meta_ad_id,
    name: row.name,
    status: row.status,
    effectiveStatus: row.effective_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listAdsByAdSet(supabase: SupabaseClient, adSetId: string): Promise<MetaAd[]> {
  const { data, error } = await supabase
    .from("meta_ads")
    .select(AD_SELECT)
    .eq("ad_set_id", adSetId)
    .order("name");

  if (error) throw new Error(`Falha ao carregar anúncios: ${error.message}`);
  return ((data ?? []) as unknown as AdRow[]).map(mapAd);
}

export async function listDisapprovedAds(
  supabase: SupabaseClient,
): Promise<{ id: string; name: string; campaignName: string }[]> {
  const { data, error } = await supabase
    .from("meta_ads")
    .select("id, name, ad_set:meta_ad_sets(campaign:meta_campaigns(name))")
    .eq("effective_status", "DISAPPROVED");

  if (error) throw new Error(`Falha ao carregar anúncios reprovados: ${error.message}`);

  return (
    (data ?? []) as unknown as {
      id: string;
      name: string;
      ad_set: { campaign: { name: string } | { name: string }[] | null } | null;
    }[]
  ).map((row) => {
    const campaign = Array.isArray(row.ad_set?.campaign)
      ? row.ad_set?.campaign[0]
      : row.ad_set?.campaign;
    return { id: row.id, name: row.name, campaignName: campaign?.name ?? "—" };
  });
}

export interface UpsertAdRow {
  metaAdId: string;
  creativeId: string | null;
  name: string;
  status: string;
  effectiveStatus: string | null;
}

export async function upsertAds(
  supabase: SupabaseClient,
  adSetId: string,
  rows: UpsertAdRow[],
): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await supabase.from("meta_ads").upsert(
    rows.map((r) => ({
      ad_set_id: adSetId,
      creative_id: r.creativeId,
      meta_ad_id: r.metaAdId,
      name: r.name,
      status: r.status,
      effective_status: r.effectiveStatus,
    })),
    { onConflict: "meta_ad_id" },
  );

  if (error) throw new Error(`Falha ao sincronizar anúncios: ${error.message}`);
}

export async function getAdIdByMetaId(
  supabase: SupabaseClient,
  metaAdId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("meta_ads")
    .select("id")
    .eq("meta_ad_id", metaAdId)
    .maybeSingle();

  if (error) throw new Error(`Falha ao localizar anúncio: ${error.message}`);
  return data?.id ?? null;
}
