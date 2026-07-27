import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { SearchConsoleConnectionStatus, SearchConsoleSite } from "@/types/searchConsole";

interface SiteRow {
  id: string;
  site_url: string;
  permission_level: string | null;
  is_synced: boolean;
  status: SearchConsoleConnectionStatus;
  last_sync_at: string | null;
  error: string | null;
  indexed_count: number | null;
  excluded_count: number | null;
  coverage_checked_at: string | null;
  client_id: string | null;
  responsible_id: string | null;
  created_at: string;
  updated_at: string;
}

const SITE_SELECT =
  "id, site_url, permission_level, is_synced, status, last_sync_at, error, indexed_count, excluded_count, coverage_checked_at, client_id, responsible_id, created_at, updated_at";

function mapSite(row: SiteRow): SearchConsoleSite {
  return {
    id: row.id,
    siteUrl: row.site_url,
    permissionLevel: row.permission_level,
    isSynced: row.is_synced,
    status: row.status,
    lastSyncAt: row.last_sync_at,
    error: row.error,
    indexedCount: row.indexed_count,
    excludedCount: row.excluded_count,
    coverageCheckedAt: row.coverage_checked_at,
    clientId: row.client_id,
    responsibleId: row.responsible_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getSyncedSearchConsoleSite(
  supabase: SupabaseClient,
): Promise<SearchConsoleSite | null> {
  const { data, error } = await supabase
    .from("search_console_sites")
    .select(SITE_SELECT)
    .eq("is_synced", true)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Falha ao carregar site do Search Console: ${error.message}`);
  return data ? mapSite(data as SiteRow) : null;
}

export async function getSearchConsoleSiteById(
  supabase: SupabaseClient,
  id: string,
): Promise<SearchConsoleSite | null> {
  const { data, error } = await supabase
    .from("search_console_sites")
    .select(SITE_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Falha ao carregar site do Search Console: ${error.message}`);
  return data ? mapSite(data as SiteRow) : null;
}

export async function listUnselectedSearchConsoleSites(
  supabase: SupabaseClient,
): Promise<SearchConsoleSite[]> {
  const { data, error } = await supabase
    .from("search_console_sites")
    .select(SITE_SELECT)
    .eq("is_synced", false)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Falha ao listar sites do Search Console: ${error.message}`);
  return ((data ?? []) as SiteRow[]).map(mapSite);
}

export interface UpsertSearchConsoleSitePayload {
  siteUrl: string;
  permissionLevel: string | null;
  createdBy: string | null;
}

export async function upsertSearchConsoleSite(
  supabase: SupabaseClient,
  payload: UpsertSearchConsoleSitePayload,
): Promise<SearchConsoleSite> {
  const { data, error } = await supabase
    .from("search_console_sites")
    .upsert(
      {
        site_url: payload.siteUrl,
        permission_level: payload.permissionLevel,
        created_by: payload.createdBy,
      },
      { onConflict: "site_url" },
    )
    .select(SITE_SELECT)
    .single();
  if (error) throw new Error(`Falha ao salvar site do Search Console: ${error.message}`);
  return mapSite(data as SiteRow);
}

export async function selectSearchConsoleSite(
  supabase: SupabaseClient,
  siteId: string,
): Promise<void> {
  const { error: clearError } = await supabase
    .from("search_console_sites")
    .update({ is_synced: false })
    .eq("is_synced", true);
  if (clearError) throw new Error(`Falha ao trocar site selecionado: ${clearError.message}`);

  const { error } = await supabase
    .from("search_console_sites")
    .update({ is_synced: true, status: "conectado", last_sync_at: new Date().toISOString() })
    .eq("id", siteId);
  if (error) throw new Error(`Falha ao selecionar site do Search Console: ${error.message}`);
}

export async function setSearchConsoleSiteStatus(
  supabase: SupabaseClient,
  id: string,
  status: SearchConsoleConnectionStatus,
  patch: { error?: string | null } = {},
): Promise<void> {
  const row: Record<string, unknown> = { status };
  if (status === "conectado") row.last_sync_at = new Date().toISOString();
  if (patch.error !== undefined) row.error = patch.error;

  const { error } = await supabase.from("search_console_sites").update(row).eq("id", id);
  if (error) throw new Error(`Falha ao atualizar status do site: ${error.message}`);
}

export async function setSearchConsoleSiteUnsynced(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("search_console_sites")
    .update({ is_synced: false, status: "desconectado" })
    .eq("id", id);
  if (error) throw new Error(`Falha ao desconectar site do Search Console: ${error.message}`);
}

export async function setSearchConsoleSiteCrmLink(
  supabase: SupabaseClient,
  id: string,
  clientId: string | null,
  responsibleId: string | null,
): Promise<void> {
  const { error } = await supabase
    .from("search_console_sites")
    .update({ client_id: clientId, responsible_id: responsibleId })
    .eq("id", id);
  if (error) throw new Error(`Falha ao vincular site ao CRM: ${error.message}`);
}
