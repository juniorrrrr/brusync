import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { SearchConsoleQuery } from "@/types/searchConsole";

interface QueryRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number | null;
  position: number | null;
}

export async function listSearchConsoleQueries(
  supabase: SupabaseClient,
  siteId: string,
  limit = 20,
): Promise<SearchConsoleQuery[]> {
  const { data, error } = await supabase
    .from("search_console_queries")
    .select("query, clicks, impressions, ctr, position")
    .eq("site_id", siteId)
    .order("clicks", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Falha ao carregar consultas do Search Console: ${error.message}`);
  return ((data ?? []) as QueryRow[]).map((row) => ({
    query: row.query,
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: row.ctr,
    position: row.position,
  }));
}

export interface ReplaceSearchConsoleQueryRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

/** Substitui a janela sincronizada — snapshot da consulta mais recente, não
 * histórico diário (mesmo espírito consolidado do restante da Fase 35). */
export async function replaceSearchConsoleQueries(
  supabase: SupabaseClient,
  siteId: string,
  periodStart: string,
  periodEnd: string,
  rows: ReplaceSearchConsoleQueryRow[],
): Promise<void> {
  const { error: deleteError } = await supabase
    .from("search_console_queries")
    .delete()
    .eq("site_id", siteId);
  if (deleteError) throw new Error(`Falha ao limpar consultas antigas: ${deleteError.message}`);

  if (rows.length === 0) return;
  const { error } = await supabase.from("search_console_queries").insert(
    rows.map((row) => ({
      site_id: siteId,
      query: row.query,
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
      period_start: periodStart,
      period_end: periodEnd,
    })),
  );
  if (error) throw new Error(`Falha ao salvar consultas do Search Console: ${error.message}`);
}
