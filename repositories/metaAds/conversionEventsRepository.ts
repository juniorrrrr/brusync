import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { MetaConversionEvent, MetaConversionEventName } from "@/types/metaAds";

interface ConversionEventRow {
  id: string;
  ad_account_id: string;
  campaign_id: string | null;
  ad_id: string | null;
  date: string;
  event_name: MetaConversionEventName;
  event_count: number;
  value: number;
  currency: string;
}

const EVENT_SELECT =
  "id, ad_account_id, campaign_id, ad_id, date, event_name, event_count, value, currency";

function mapEvent(row: ConversionEventRow): MetaConversionEvent {
  return {
    id: row.id,
    adAccountId: row.ad_account_id,
    campaignId: row.campaign_id,
    adId: row.ad_id,
    date: row.date,
    eventName: row.event_name,
    eventCount: row.event_count,
    value: Number(row.value),
    currency: row.currency,
  };
}

export async function listConversionEvents(
  supabase: SupabaseClient,
  adAccountId: string,
  since: string,
  until: string,
): Promise<MetaConversionEvent[]> {
  const { data, error } = await supabase
    .from("meta_conversion_events")
    .select(EVENT_SELECT)
    .eq("ad_account_id", adAccountId)
    .gte("date", since)
    .lte("date", until)
    .order("date");

  if (error) throw new Error(`Falha ao carregar eventos de conversão: ${error.message}`);
  return ((data ?? []) as ConversionEventRow[]).map(mapEvent);
}

export interface UpsertConversionEventRow {
  campaignId: string | null;
  adId: string | null;
  date: string;
  eventName: MetaConversionEventName;
  eventCount: number;
  value: number;
  currency: string;
}

export async function upsertConversionEvents(
  supabase: SupabaseClient,
  adAccountId: string,
  rows: UpsertConversionEventRow[],
): Promise<void> {
  for (const row of rows) {
    let del = supabase
      .from("meta_conversion_events")
      .delete()
      .eq("ad_account_id", adAccountId)
      .eq("date", row.date)
      .eq("event_name", row.eventName);
    del = row.campaignId ? del.eq("campaign_id", row.campaignId) : del.is("campaign_id", null);
    del = row.adId ? del.eq("ad_id", row.adId) : del.is("ad_id", null);
    const { error: deleteError } = await del;
    if (deleteError) throw new Error(`Falha ao sincronizar conversões: ${deleteError.message}`);

    const { error: insertError } = await supabase.from("meta_conversion_events").insert({
      ad_account_id: adAccountId,
      campaign_id: row.campaignId,
      ad_id: row.adId,
      date: row.date,
      event_name: row.eventName,
      event_count: row.eventCount,
      value: row.value,
      currency: row.currency,
    });
    if (insertError) throw new Error(`Falha ao sincronizar conversões: ${insertError.message}`);
  }
}
