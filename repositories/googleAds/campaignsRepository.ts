import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { GoogleAdsCampaign, GoogleAdsCampaignStatus } from "@/types/googleAds";

interface CampaignRow {
  id: string;
  account_id: string;
  campaign_id: string;
  name: string;
  channel_type: string | null;
  status: GoogleAdsCampaignStatus;
  budget_amount: number | null;
  crm_project_id: string | null;
  crm_projects: { name: string } | { name: string }[] | null;
  created_at: string;
  updated_at: string;
}

const CAMPAIGN_SELECT =
  "id, account_id, campaign_id, name, channel_type, status, budget_amount, crm_project_id, crm_projects (name), created_at, updated_at";

function mapCampaign(row: CampaignRow): GoogleAdsCampaign {
  const project = Array.isArray(row.crm_projects) ? row.crm_projects[0] : row.crm_projects;
  return {
    id: row.id,
    accountId: row.account_id,
    campaignId: row.campaign_id,
    name: row.name,
    channelType: row.channel_type,
    status: row.status,
    budgetAmount: row.budget_amount,
    crmProjectId: row.crm_project_id,
    crmProjectName: project?.name ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listGoogleAdsCampaigns(
  supabase: SupabaseClient,
  accountId: string,
): Promise<GoogleAdsCampaign[]> {
  const { data, error } = await supabase
    .from("google_ads_campaigns")
    .select(CAMPAIGN_SELECT)
    .eq("account_id", accountId)
    .order("name");
  if (error) throw new Error(`Falha ao carregar campanhas do Google Ads: ${error.message}`);
  return ((data ?? []) as unknown as CampaignRow[]).map(mapCampaign);
}

export interface UpsertGoogleAdsCampaignRow {
  campaignId: string;
  name: string;
  channelType: string | null;
  status: GoogleAdsCampaignStatus;
  budgetAmount: number | null;
}

export async function upsertGoogleAdsCampaigns(
  supabase: SupabaseClient,
  accountId: string,
  rows: UpsertGoogleAdsCampaignRow[],
): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await supabase.from("google_ads_campaigns").upsert(
    rows.map((row) => ({
      account_id: accountId,
      campaign_id: row.campaignId,
      name: row.name,
      channel_type: row.channelType,
      status: row.status,
      budget_amount: row.budgetAmount,
    })),
    { onConflict: "campaign_id" },
  );
  if (error) throw new Error(`Falha ao salvar campanhas do Google Ads: ${error.message}`);
}

export async function setGoogleAdsCampaignProjectLink(
  supabase: SupabaseClient,
  campaignId: string,
  crmProjectId: string | null,
): Promise<void> {
  const { error } = await supabase
    .from("google_ads_campaigns")
    .update({ crm_project_id: crmProjectId })
    .eq("id", campaignId);
  if (error) throw new Error(`Falha ao vincular campanha ao projeto: ${error.message}`);
}
