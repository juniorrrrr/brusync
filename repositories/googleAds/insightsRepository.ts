import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  GoogleAdsDailySpendPoint,
  GoogleAdsInsightDaily,
  GoogleAdsSummary,
} from "@/types/googleAds";

interface InsightRow {
  date: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  conversions_value: number;
  ctr: number | null;
  cpm: number | null;
  cpa: number | null;
  roas: number | null;
  roi: number | null;
}

const INSIGHT_SELECT =
  "date, impressions, clicks, cost, conversions, conversions_value, ctr, cpm, cpa, roas, roi";

function mapInsight(row: InsightRow): GoogleAdsInsightDaily {
  return {
    date: row.date,
    impressions: row.impressions,
    clicks: row.clicks,
    cost: row.cost,
    conversions: row.conversions,
    conversionsValue: row.conversions_value,
    ctr: row.ctr,
    cpm: row.cpm,
    cpa: row.cpa,
    roas: row.roas,
    roi: row.roi,
  };
}

/** Métricas no nível da conta (campaign_id nulo) — usadas pelo dashboard
 * consolidado; cada campanha some via metrics.campaign_id quando quisermos
 * detalhar (não exposto nesta fase, sem tela nova para isso). */
export async function listAccountDailyInsights(
  supabase: SupabaseClient,
  accountId: string,
  sinceIso: string,
): Promise<GoogleAdsInsightDaily[]> {
  const { data, error } = await supabase
    .from("google_ads_insights_daily")
    .select(INSIGHT_SELECT)
    .eq("account_id", accountId)
    .is("campaign_id", null)
    .gte("date", sinceIso)
    .order("date");
  if (error) throw new Error(`Falha ao carregar métricas do Google Ads: ${error.message}`);
  return ((data ?? []) as InsightRow[]).map(mapInsight);
}

export interface UpsertGoogleAdsInsightRow {
  campaignId: string | null;
  date: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  conversionsValue: number;
}

function deriveMetrics(row: UpsertGoogleAdsInsightRow): {
  ctr: number | null;
  cpm: number | null;
  cpa: number | null;
  roas: number | null;
  roi: number | null;
} {
  return {
    ctr: row.impressions > 0 ? (row.clicks / row.impressions) * 100 : null,
    cpm: row.impressions > 0 ? (row.cost / row.impressions) * 1000 : null,
    cpa: row.conversions > 0 ? row.cost / row.conversions : null,
    roas: row.cost > 0 ? row.conversionsValue / row.cost : null,
    roi: row.cost > 0 ? ((row.conversionsValue - row.cost) / row.cost) * 100 : null,
  };
}

/** Substitui a janela sincronizada em vez de fazer upsert por conflito — o
 * índice único da tabela (account_id, coalesce(campaign_id, ...), date) é
 * uma expressão, que o `.upsert({onConflict})` do PostgREST não consegue
 * mirar diretamente quando campaign_id pode ser nulo. Como cada sync já
 * refaz a janela inteira (isDaysAgo..hoje), apagar e reinserir é idempotente
 * e mais simples do que reconciliar linha a linha. */
export async function upsertGoogleAdsInsights(
  supabase: SupabaseClient,
  accountId: string,
  rows: UpsertGoogleAdsInsightRow[],
): Promise<void> {
  if (rows.length === 0) return;

  const dates = rows.map((row) => row.date).sort();
  const { error: deleteError } = await supabase
    .from("google_ads_insights_daily")
    .delete()
    .eq("account_id", accountId)
    .is("campaign_id", null)
    .gte("date", dates[0])
    .lte("date", dates[dates.length - 1]);
  if (deleteError) throw new Error(`Falha ao limpar métricas antigas: ${deleteError.message}`);

  const { error } = await supabase.from("google_ads_insights_daily").insert(
    rows.map((row) => {
      const derived = deriveMetrics(row);
      return {
        account_id: accountId,
        campaign_id: row.campaignId,
        date: row.date,
        impressions: row.impressions,
        clicks: row.clicks,
        cost: row.cost,
        conversions: row.conversions,
        conversions_value: row.conversionsValue,
        ...derived,
      };
    }),
  );
  if (error) throw new Error(`Falha ao salvar métricas do Google Ads: ${error.message}`);
}

export function summarizeGoogleAdsInsights(
  rows: GoogleAdsInsightDaily[],
  activeCampaigns: number,
): GoogleAdsSummary {
  const totals = rows.reduce(
    (acc, row) => ({
      spend: acc.spend + row.cost,
      clicks: acc.clicks + row.clicks,
      impressions: acc.impressions + row.impressions,
      conversions: acc.conversions + row.conversions,
      conversionsValue: acc.conversionsValue + row.conversionsValue,
    }),
    { spend: 0, clicks: 0, impressions: 0, conversions: 0, conversionsValue: 0 },
  );

  return {
    ...totals,
    ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : null,
    cpm: totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : null,
    cpa: totals.conversions > 0 ? totals.spend / totals.conversions : null,
    roas: totals.spend > 0 ? totals.conversionsValue / totals.spend : null,
    roi: totals.spend > 0 ? ((totals.conversionsValue - totals.spend) / totals.spend) * 100 : null,
    activeCampaigns,
  };
}

export function buildDailySpendSeries(rows: GoogleAdsInsightDaily[]): GoogleAdsDailySpendPoint[] {
  return rows.map((row) => ({ date: row.date, cost: row.cost, conversions: row.conversions }));
}
