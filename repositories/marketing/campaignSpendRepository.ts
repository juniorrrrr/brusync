import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { CampaignSpendEntry } from "@/types/marketing";

interface CampaignSpendDbRow {
  id: string;
  created_at: string;
  updated_at: string;
  utm_source: string;
  utm_campaign: string;
  period_month: string;
  amount: number;
  currency: string;
  notes: string | null;
}

function mapSpend(row: CampaignSpendDbRow): CampaignSpendEntry {
  return {
    id: row.id,
    utmSource: row.utm_source,
    utmCampaign: row.utm_campaign,
    periodMonth: row.period_month,
    amount: Number(row.amount),
    currency: row.currency,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const SPEND_SELECT =
  "id, created_at, updated_at, utm_source, utm_campaign, period_month, amount, currency, notes";

export async function listCampaignSpend(
  supabase: SupabaseClient,
  options: { periodFrom?: string; periodTo?: string } = {},
): Promise<CampaignSpendEntry[]> {
  let query = supabase.from("marketing_campaign_spend").select(SPEND_SELECT);
  if (options.periodFrom) query = query.gte("period_month", options.periodFrom);
  if (options.periodTo) query = query.lte("period_month", options.periodTo);

  const { data, error } = await query.order("period_month", { ascending: false });
  if (error) throw new Error(`Falha ao carregar investimento por campanha: ${error.message}`);
  return ((data ?? []) as unknown as CampaignSpendDbRow[]).map(mapSpend);
}

export interface UpsertCampaignSpendPayload {
  utmSource: string;
  utmCampaign: string;
  periodMonth: string;
  amount: number;
  currency?: string;
  notes?: string | null;
  createdBy: string;
}

export async function upsertCampaignSpend(
  supabase: SupabaseClient,
  payload: UpsertCampaignSpendPayload,
): Promise<void> {
  const { error } = await supabase.from("marketing_campaign_spend").upsert(
    {
      utm_source: payload.utmSource,
      utm_campaign: payload.utmCampaign,
      period_month: payload.periodMonth,
      amount: payload.amount,
      currency: payload.currency ?? "BRL",
      notes: payload.notes ?? null,
      created_by: payload.createdBy,
    },
    { onConflict: "utm_source,utm_campaign,period_month" },
  );
  if (error) throw new Error(`Falha ao salvar investimento: ${error.message}`);
}

export async function deleteCampaignSpend(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("marketing_campaign_spend").delete().eq("id", id);
  if (error) throw new Error(`Falha ao excluir investimento: ${error.message}`);
}
