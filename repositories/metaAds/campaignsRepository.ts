import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { MetaCampaign, MetaCampaignStatus } from "@/types/metaAds";

interface CampaignRow {
  id: string;
  ad_account_id: string;
  meta_campaign_id: string;
  name: string;
  objective: string | null;
  status: MetaCampaignStatus;
  effective_status: string | null;
  daily_budget: number | null;
  lifetime_budget: number | null;
  budget_remaining: number | null;
  start_time: string | null;
  stop_time: string | null;
  crm_project_id: string | null;
  project: { name: string } | { name: string }[] | null;
  created_at: string;
  updated_at: string;
}

const CAMPAIGN_SELECT = `
  id, ad_account_id, meta_campaign_id, name, objective, status, effective_status,
  daily_budget, lifetime_budget, budget_remaining, start_time, stop_time,
  crm_project_id, created_at, updated_at,
  project:crm_projects(name)
`;

function first<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function mapCampaign(row: CampaignRow): MetaCampaign {
  const project = first(row.project);
  return {
    id: row.id,
    adAccountId: row.ad_account_id,
    metaCampaignId: row.meta_campaign_id,
    name: row.name,
    objective: row.objective,
    status: row.status,
    effectiveStatus: row.effective_status,
    dailyBudget: row.daily_budget,
    lifetimeBudget: row.lifetime_budget,
    budgetRemaining: row.budget_remaining,
    startTime: row.start_time,
    stopTime: row.stop_time,
    crmProjectId: row.crm_project_id,
    crmProjectName: project?.name ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface ListCampaignsOptions {
  adAccountId?: string;
  status?: MetaCampaignStatus;
}

export async function listCampaigns(
  supabase: SupabaseClient,
  options: ListCampaignsOptions = {},
): Promise<MetaCampaign[]> {
  let query = supabase.from("meta_campaigns").select(CAMPAIGN_SELECT);
  if (options.adAccountId) query = query.eq("ad_account_id", options.adAccountId);
  if (options.status) query = query.eq("status", options.status);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw new Error(`Falha ao carregar campanhas: ${error.message}`);
  return ((data ?? []) as unknown as CampaignRow[]).map(mapCampaign);
}

export async function getCampaignById(
  supabase: SupabaseClient,
  id: string,
): Promise<MetaCampaign | null> {
  const { data, error } = await supabase
    .from("meta_campaigns")
    .select(CAMPAIGN_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Falha ao carregar campanha: ${error.message}`);
  return data ? mapCampaign(data as unknown as CampaignRow) : null;
}

export interface UpsertCampaignRow {
  metaCampaignId: string;
  name: string;
  objective: string | null;
  status: string;
  effectiveStatus: string | null;
  dailyBudget: number | null;
  lifetimeBudget: number | null;
  budgetRemaining: number | null;
  startTime: string | null;
  stopTime: string | null;
}

export async function upsertCampaigns(
  supabase: SupabaseClient,
  adAccountId: string,
  rows: UpsertCampaignRow[],
): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await supabase.from("meta_campaigns").upsert(
    rows.map((r) => ({
      ad_account_id: adAccountId,
      meta_campaign_id: r.metaCampaignId,
      name: r.name,
      objective: r.objective,
      status: r.status,
      effective_status: r.effectiveStatus,
      daily_budget: r.dailyBudget,
      lifetime_budget: r.lifetimeBudget,
      budget_remaining: r.budgetRemaining,
      start_time: r.startTime,
      stop_time: r.stopTime,
    })),
    { onConflict: "meta_campaign_id" },
  );

  if (error) throw new Error(`Falha ao sincronizar campanhas: ${error.message}`);
}

export async function linkCampaignToProject(
  supabase: SupabaseClient,
  id: string,
  crmProjectId: string | null,
): Promise<void> {
  const { error } = await supabase
    .from("meta_campaigns")
    .update({ crm_project_id: crmProjectId })
    .eq("id", id);

  if (error) throw new Error(`Falha ao vincular campanha ao projeto: ${error.message}`);
}

export async function getCampaignIdByMetaId(
  supabase: SupabaseClient,
  metaCampaignId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("meta_campaigns")
    .select("id")
    .eq("meta_campaign_id", metaCampaignId)
    .maybeSingle();

  if (error) throw new Error(`Falha ao localizar campanha: ${error.message}`);
  return data?.id ?? null;
}
