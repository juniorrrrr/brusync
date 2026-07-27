import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { SearchConsoleSitemap } from "@/types/searchConsole";

interface SitemapRow {
  sitemap_url: string;
  status: string | null;
  is_pending: boolean;
  errors_count: number;
  warnings_count: number;
  submitted_at: string | null;
  last_downloaded_at: string | null;
}

const SITEMAP_SELECT =
  "sitemap_url, status, is_pending, errors_count, warnings_count, submitted_at, last_downloaded_at";

function mapSitemap(row: SitemapRow): SearchConsoleSitemap {
  return {
    sitemapUrl: row.sitemap_url,
    status: row.status,
    isPending: row.is_pending,
    errorsCount: row.errors_count,
    warningsCount: row.warnings_count,
    submittedAt: row.submitted_at,
    lastDownloadedAt: row.last_downloaded_at,
  };
}

export async function listSearchConsoleSitemaps(
  supabase: SupabaseClient,
  siteId: string,
): Promise<SearchConsoleSitemap[]> {
  const { data, error } = await supabase
    .from("search_console_sitemaps")
    .select(SITEMAP_SELECT)
    .eq("site_id", siteId)
    .order("submitted_at", { ascending: false, nullsFirst: false });
  if (error) throw new Error(`Falha ao carregar sitemaps: ${error.message}`);
  return ((data ?? []) as SitemapRow[]).map(mapSitemap);
}

export interface UpsertSearchConsoleSitemapRow {
  sitemapUrl: string;
  isPending: boolean;
  errorsCount: number;
  warningsCount: number;
  submittedAt: string | null;
  lastDownloadedAt: string | null;
}

export async function upsertSearchConsoleSitemaps(
  supabase: SupabaseClient,
  siteId: string,
  rows: UpsertSearchConsoleSitemapRow[],
): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await supabase.from("search_console_sitemaps").upsert(
    rows.map((row) => ({
      site_id: siteId,
      sitemap_url: row.sitemapUrl,
      status: row.errorsCount > 0 ? "com_erros" : row.isPending ? "pendente" : "ok",
      is_pending: row.isPending,
      errors_count: row.errorsCount,
      warnings_count: row.warningsCount,
      submitted_at: row.submittedAt,
      last_downloaded_at: row.lastDownloadedAt,
    })),
    { onConflict: "site_id,sitemap_url" },
  );
  if (error) throw new Error(`Falha ao salvar sitemaps: ${error.message}`);
}
