import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { MetaInsightLevel, MetaInsightRaw, MetaInsightRow } from "@/types/metaAds";

interface InsightRow {
  id: string;
  ad_account_id: string;
  campaign_id: string | null;
  ad_set_id: string | null;
  ad_id: string | null;
  level: MetaInsightLevel;
  date: string;
  impressions: number;
  reach: number;
  frequency: number | null;
  clicks: number;
  spend: number;
  conversions: number;
  leads: number;
  purchases: number;
  revenue: number;
}

const INSIGHT_SELECT = `
  id, ad_account_id, campaign_id, ad_set_id, ad_id, level, date, impressions, reach,
  frequency, clicks, spend, conversions, leads, purchases, revenue
`;

function mapInsight(row: InsightRow): MetaInsightRow {
  return {
    id: row.id,
    adAccountId: row.ad_account_id,
    campaignId: row.campaign_id,
    adSetId: row.ad_set_id,
    adId: row.ad_id,
    level: row.level,
    date: row.date,
    impressions: row.impressions,
    reach: row.reach,
    frequency: row.frequency,
    clicks: row.clicks,
    spend: Number(row.spend),
    conversions: row.conversions,
    leads: row.leads,
    purchases: row.purchases,
    revenue: Number(row.revenue),
  };
}

export interface ListInsightsOptions {
  adAccountId: string;
  level: MetaInsightLevel;
  since: string;
  until: string;
  campaignId?: string;
}

export async function listInsights(
  supabase: SupabaseClient,
  options: ListInsightsOptions,
): Promise<MetaInsightRow[]> {
  let query = supabase
    .from("meta_insights")
    .select(INSIGHT_SELECT)
    .eq("ad_account_id", options.adAccountId)
    .eq("level", options.level)
    .gte("date", options.since)
    .lte("date", options.until);

  if (options.campaignId) query = query.eq("campaign_id", options.campaignId);

  const { data, error } = await query.order("date");
  if (error) throw new Error(`Falha ao carregar insights: ${error.message}`);
  return ((data ?? []) as InsightRow[]).map(mapInsight);
}

/** Uma linha por campanha, somando o período — usado pelo dashboard para
 * ranquear top/piores campanhas sem trazer o insight dia a dia. */
export async function listCampaignInsightTotals(
  supabase: SupabaseClient,
  adAccountId: string,
  since: string,
  until: string,
): Promise<Map<string, MetaInsightRaw>> {
  const { data, error } = await supabase
    .from("meta_insights")
    .select(
      "campaign_id, date, impressions, reach, clicks, spend, conversions, leads, purchases, revenue",
    )
    .eq("ad_account_id", adAccountId)
    .eq("level", "campaign")
    .gte("date", since)
    .lte("date", until);

  if (error) throw new Error(`Falha ao carregar insights por campanha: ${error.message}`);

  const totals = new Map<string, MetaInsightRaw>();
  for (const row of (data ?? []) as {
    campaign_id: string | null;
    date: string;
    impressions: number;
    reach: number;
    clicks: number;
    spend: number;
    conversions: number;
    leads: number;
    purchases: number;
    revenue: number;
  }[]) {
    if (!row.campaign_id) continue;
    const acc = totals.get(row.campaign_id) ?? {
      date: since,
      impressions: 0,
      reach: 0,
      frequency: null,
      clicks: 0,
      spend: 0,
      conversions: 0,
      leads: 0,
      purchases: 0,
      revenue: 0,
    };
    totals.set(row.campaign_id, {
      ...acc,
      impressions: acc.impressions + row.impressions,
      reach: acc.reach + row.reach,
      clicks: acc.clicks + row.clicks,
      spend: acc.spend + Number(row.spend),
      conversions: acc.conversions + row.conversions,
      leads: acc.leads + row.leads,
      purchases: acc.purchases + row.purchases,
      revenue: acc.revenue + Number(row.revenue),
    });
  }
  return totals;
}

export async function listDailySpend(
  supabase: SupabaseClient,
  adAccountId: string,
  since: string,
  until: string,
): Promise<{ date: string; spend: number; conversions: number }[]> {
  const { data, error } = await supabase
    .from("meta_insights")
    .select("date, spend, conversions")
    .eq("ad_account_id", adAccountId)
    .eq("level", "account")
    .gte("date", since)
    .lte("date", until)
    .order("date");

  if (error) throw new Error(`Falha ao carregar gasto diário: ${error.message}`);
  return ((data ?? []) as { date: string; spend: number; conversions: number }[]).map((row) => ({
    date: row.date,
    spend: Number(row.spend),
    conversions: row.conversions,
  }));
}

export interface UpsertInsightRow {
  level: MetaInsightLevel;
  campaignId: string | null;
  adSetId: string | null;
  adId: string | null;
  date: string;
  impressions: number;
  reach: number;
  frequency: number | null;
  clicks: number;
  spend: number;
  conversions: number;
  leads: number;
  purchases: number;
  revenue: number;
}

export async function upsertInsights(
  supabase: SupabaseClient,
  adAccountId: string,
  rows: UpsertInsightRow[],
): Promise<void> {
  if (rows.length === 0) return;
  const payload = rows.map((r) => {
    const ctr = r.impressions > 0 ? (r.clicks / r.impressions) * 100 : null;
    const cpm = r.impressions > 0 ? (r.spend / r.impressions) * 1000 : null;
    const cpc = r.clicks > 0 ? r.spend / r.clicks : null;
    return {
      ad_account_id: adAccountId,
      level: r.level,
      campaign_id: r.campaignId,
      ad_set_id: r.adSetId,
      ad_id: r.adId,
      date: r.date,
      impressions: r.impressions,
      reach: r.reach,
      frequency: r.frequency,
      clicks: r.clicks,
      spend: r.spend,
      ctr,
      cpm,
      cpc,
      conversions: r.conversions,
      leads: r.leads,
      purchases: r.purchases,
      revenue: r.revenue,
    };
  });

  // meta_insights_unique_idx é uma unique index de expressão (com coalesce),
  // não um constraint nomeado — upsert não consegue usar onConflict nesse
  // caso, então cada linha é gravada com delete+insert dentro do mesmo dia.
  for (const row of payload) {
    let del = supabase
      .from("meta_insights")
      .delete()
      .eq("ad_account_id", row.ad_account_id)
      .eq("level", row.level)
      .eq("date", row.date);
    del = row.campaign_id ? del.eq("campaign_id", row.campaign_id) : del.is("campaign_id", null);
    del = row.ad_set_id ? del.eq("ad_set_id", row.ad_set_id) : del.is("ad_set_id", null);
    del = row.ad_id ? del.eq("ad_id", row.ad_id) : del.is("ad_id", null);
    const { error: deleteError } = await del;
    if (deleteError) throw new Error(`Falha ao sincronizar insights: ${deleteError.message}`);

    const { error: insertError } = await supabase.from("meta_insights").insert(row);
    if (insertError) throw new Error(`Falha ao sincronizar insights: ${insertError.message}`);
  }
}
