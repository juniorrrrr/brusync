import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { GoogleAdsKeyword } from "@/types/googleAds";

interface KeywordRow {
  id: string;
  campaign_id: string;
  keyword_id: string;
  ad_group_name: string | null;
  text: string;
  match_type: string | null;
  status: string;
  clicks: number;
  impressions: number;
  cost: number;
}

const KEYWORD_SELECT =
  "id, campaign_id, keyword_id, ad_group_name, text, match_type, status, clicks, impressions, cost";

function mapKeyword(row: KeywordRow): GoogleAdsKeyword {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    keywordId: row.keyword_id,
    adGroupName: row.ad_group_name,
    text: row.text,
    matchType: row.match_type,
    status: row.status,
    clicks: row.clicks,
    impressions: row.impressions,
    cost: row.cost,
  };
}

export async function listGoogleAdsKeywords(
  supabase: SupabaseClient,
  campaignId: string,
): Promise<GoogleAdsKeyword[]> {
  const { data, error } = await supabase
    .from("google_ads_keywords")
    .select(KEYWORD_SELECT)
    .eq("campaign_id", campaignId)
    .order("clicks", { ascending: false });
  if (error) throw new Error(`Falha ao carregar palavras-chave: ${error.message}`);
  return ((data ?? []) as KeywordRow[]).map(mapKeyword);
}

export async function listTopGoogleAdsKeywords(
  supabase: SupabaseClient,
  accountId: string,
  limit = 20,
): Promise<GoogleAdsKeyword[]> {
  const { data, error } = await supabase
    .from("google_ads_keywords")
    .select(`${KEYWORD_SELECT}, google_ads_campaigns!inner (account_id)`)
    .eq("google_ads_campaigns.account_id", accountId)
    .order("clicks", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Falha ao carregar palavras-chave: ${error.message}`);
  return ((data ?? []) as unknown as KeywordRow[]).map(mapKeyword);
}

export interface UpsertGoogleAdsKeywordRow {
  keywordId: string;
  adGroupName: string | null;
  text: string;
  matchType: string | null;
  status: string;
  clicks: number;
  impressions: number;
  cost: number;
}

export async function upsertGoogleAdsKeywords(
  supabase: SupabaseClient,
  campaignId: string,
  rows: UpsertGoogleAdsKeywordRow[],
): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await supabase.from("google_ads_keywords").upsert(
    rows.map((row) => ({
      campaign_id: campaignId,
      keyword_id: row.keywordId,
      ad_group_name: row.adGroupName,
      text: row.text,
      match_type: row.matchType,
      status: row.status,
      clicks: row.clicks,
      impressions: row.impressions,
      cost: row.cost,
    })),
    { onConflict: "keyword_id" },
  );
  if (error) throw new Error(`Falha ao salvar palavras-chave: ${error.message}`);
}
