import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Ga4ChannelBreakdown, Ga4DeviceBreakdown, Ga4DimensionType } from "@/types/ga4";

interface BreakdownRow {
  dimension_value: string;
  sessions: number;
  users: number;
  conversions: number;
}

export interface UpsertGa4BreakdownRow {
  date: string;
  dimensionValue: string;
  sessions: number;
  users: number;
  conversions: number;
}

/** Sem constraint única (a tabela não tem uma coluna determinística o
 * bastante para uma — dimension_value é texto livre vindo do Google) —
 * substitui a janela sincronizada em vez de tentar reconciliar linha a
 * linha, mesmo espírito de repositories/googleAds/insightsRepository.ts. */
export async function replaceGa4DimensionBreakdown(
  supabase: SupabaseClient,
  propertyId: string,
  dimensionType: Ga4DimensionType,
  rows: UpsertGa4BreakdownRow[],
): Promise<void> {
  const { error: deleteError } = await supabase
    .from("ga4_dimension_breakdown_daily")
    .delete()
    .eq("property_id", propertyId)
    .eq("dimension_type", dimensionType);
  if (deleteError) throw new Error(`Falha ao limpar quebra do GA4: ${deleteError.message}`);

  if (rows.length === 0) return;
  const { error } = await supabase.from("ga4_dimension_breakdown_daily").insert(
    rows.map((row) => ({
      property_id: propertyId,
      date: row.date,
      dimension_type: dimensionType,
      dimension_value: row.dimensionValue,
      sessions: row.sessions,
      users: row.users,
      conversions: row.conversions,
    })),
  );
  if (error) throw new Error(`Falha ao salvar quebra do GA4: ${error.message}`);
}

export async function summarizeGa4ChannelBreakdown(
  supabase: SupabaseClient,
  propertyId: string,
  limit = 5,
): Promise<Ga4ChannelBreakdown[]> {
  const { data, error } = await supabase
    .from("ga4_dimension_breakdown_daily")
    .select("dimension_value, sessions, users, conversions")
    .eq("property_id", propertyId)
    .eq("dimension_type", "channel");
  if (error) throw new Error(`Falha ao carregar canais do GA4: ${error.message}`);

  return aggregateByDimension((data ?? []) as BreakdownRow[])
    .map(([channel, totals]) => ({ channel, ...totals }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, limit);
}

export async function summarizeGa4DeviceBreakdown(
  supabase: SupabaseClient,
  propertyId: string,
): Promise<Ga4DeviceBreakdown[]> {
  const { data, error } = await supabase
    .from("ga4_dimension_breakdown_daily")
    .select("dimension_value, sessions, users, conversions")
    .eq("property_id", propertyId)
    .eq("dimension_type", "device");
  if (error) throw new Error(`Falha ao carregar dispositivos do GA4: ${error.message}`);

  return aggregateByDimension((data ?? []) as BreakdownRow[]).map(([device, totals]) => ({
    device,
    sessions: totals.sessions,
    users: totals.users,
  }));
}

function aggregateByDimension(
  rows: BreakdownRow[],
): [string, { sessions: number; users: number; conversions: number }][] {
  const map = new Map<string, { sessions: number; users: number; conversions: number }>();
  for (const row of rows) {
    const acc = map.get(row.dimension_value) ?? { sessions: 0, users: 0, conversions: 0 };
    acc.sessions += row.sessions;
    acc.users += row.users;
    acc.conversions += row.conversions;
    map.set(row.dimension_value, acc);
  }
  return [...map.entries()];
}
