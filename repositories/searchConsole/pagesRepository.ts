import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { SearchConsolePage } from "@/types/searchConsole";

interface PageRow {
  page_url: string;
  clicks: number;
  impressions: number;
  ctr: number | null;
  position: number | null;
}

export async function listSearchConsolePages(
  supabase: SupabaseClient,
  siteId: string,
  limit = 20,
): Promise<SearchConsolePage[]> {
  const { data, error } = await supabase
    .from("search_console_pages")
    .select("page_url, clicks, impressions, ctr, position")
    .eq("site_id", siteId)
    .order("clicks", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Falha ao carregar páginas do Search Console: ${error.message}`);
  return ((data ?? []) as PageRow[]).map((row) => ({
    pageUrl: row.page_url,
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: row.ctr,
    position: row.position,
  }));
}

export interface ReplaceSearchConsolePageRow {
  pageUrl: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export async function replaceSearchConsolePages(
  supabase: SupabaseClient,
  siteId: string,
  periodStart: string,
  periodEnd: string,
  rows: ReplaceSearchConsolePageRow[],
): Promise<void> {
  const { error: deleteError } = await supabase
    .from("search_console_pages")
    .delete()
    .eq("site_id", siteId);
  if (deleteError) throw new Error(`Falha ao limpar páginas antigas: ${deleteError.message}`);

  if (rows.length === 0) return;
  const { error } = await supabase.from("search_console_pages").insert(
    rows.map((row) => ({
      site_id: siteId,
      page_url: row.pageUrl,
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
      period_start: periodStart,
      period_end: periodEnd,
    })),
  );
  if (error) throw new Error(`Falha ao salvar páginas do Search Console: ${error.message}`);
}
