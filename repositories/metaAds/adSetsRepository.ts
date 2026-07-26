import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { MetaAdSet, MetaCampaignStatus } from "@/types/metaAds";

interface AdSetRow {
  id: string;
  campaign_id: string;
  meta_ad_set_id: string;
  name: string;
  status: MetaCampaignStatus;
  effective_status: string | null;
  daily_budget: number | null;
  lifetime_budget: number | null;
  optimization_goal: string | null;
  billing_event: string | null;
  targeting: Record<string, unknown>;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
  updated_at: string;
}

const AD_SET_SELECT = `
  id, campaign_id, meta_ad_set_id, name, status, effective_status, daily_budget,
  lifetime_budget, optimization_goal, billing_event, targeting, start_time, end_time,
  created_at, updated_at
`;

function mapAdSet(row: AdSetRow): MetaAdSet {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    metaAdSetId: row.meta_ad_set_id,
    name: row.name,
    status: row.status,
    effectiveStatus: row.effective_status,
    dailyBudget: row.daily_budget,
    lifetimeBudget: row.lifetime_budget,
    optimizationGoal: row.optimization_goal,
    billingEvent: row.billing_event,
    targeting: row.targeting ?? {},
    startTime: row.start_time,
    endTime: row.end_time,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listAdSetsByCampaign(
  supabase: SupabaseClient,
  campaignId: string,
): Promise<MetaAdSet[]> {
  const { data, error } = await supabase
    .from("meta_ad_sets")
    .select(AD_SET_SELECT)
    .eq("campaign_id", campaignId)
    .order("name");

  if (error) throw new Error(`Falha ao carregar conjuntos de anúncios: ${error.message}`);
  return ((data ?? []) as AdSetRow[]).map(mapAdSet);
}

export interface UpsertAdSetRow {
  metaAdSetId: string;
  name: string;
  status: string;
  effectiveStatus: string | null;
  dailyBudget: number | null;
  lifetimeBudget: number | null;
  optimizationGoal: string | null;
  billingEvent: string | null;
  targeting: Record<string, unknown>;
  startTime: string | null;
  endTime: string | null;
}

export async function upsertAdSets(
  supabase: SupabaseClient,
  campaignId: string,
  rows: UpsertAdSetRow[],
): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await supabase.from("meta_ad_sets").upsert(
    rows.map((r) => ({
      campaign_id: campaignId,
      meta_ad_set_id: r.metaAdSetId,
      name: r.name,
      status: r.status,
      effective_status: r.effectiveStatus,
      daily_budget: r.dailyBudget,
      lifetime_budget: r.lifetimeBudget,
      optimization_goal: r.optimizationGoal,
      billing_event: r.billingEvent,
      targeting: r.targeting,
      start_time: r.startTime,
      end_time: r.endTime,
    })),
    { onConflict: "meta_ad_set_id" },
  );

  if (error) throw new Error(`Falha ao sincronizar conjuntos de anúncios: ${error.message}`);
}

export async function getAdSetIdByMetaId(
  supabase: SupabaseClient,
  metaAdSetId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("meta_ad_sets")
    .select("id")
    .eq("meta_ad_set_id", metaAdSetId)
    .maybeSingle();

  if (error) throw new Error(`Falha ao localizar conjunto de anúncios: ${error.message}`);
  return data?.id ?? null;
}
