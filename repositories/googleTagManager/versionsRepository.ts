import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { GtmVersion } from "@/types/gtm";

interface VersionRow {
  id: string;
  container_id: string;
  version_external_id: string;
  name: string | null;
  published_at: string | null;
}

const VERSION_SELECT = "id, container_id, version_external_id, name, published_at";

function mapVersion(row: VersionRow): GtmVersion {
  return {
    id: row.id,
    containerId: row.container_id,
    versionExternalId: row.version_external_id,
    name: row.name,
    publishedAt: row.published_at,
  };
}

export async function listGtmVersions(
  supabase: SupabaseClient,
  containerId: string,
  limit = 10,
): Promise<GtmVersion[]> {
  const { data, error } = await supabase
    .from("gtm_versions")
    .select(VERSION_SELECT)
    .eq("container_id", containerId)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) throw new Error(`Falha ao carregar versões do GTM: ${error.message}`);
  return ((data ?? []) as VersionRow[]).map(mapVersion);
}

export interface UpsertGtmVersionRow {
  versionExternalId: string;
  name: string | null;
  publishedAt: string | null;
}

export async function upsertGtmVersions(
  supabase: SupabaseClient,
  containerId: string,
  rows: UpsertGtmVersionRow[],
): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await supabase.from("gtm_versions").upsert(
    rows.map((row) => ({
      container_id: containerId,
      version_external_id: row.versionExternalId,
      name: row.name,
      published_at: row.publishedAt,
    })),
    { onConflict: "container_id,version_external_id" },
  );
  if (error) throw new Error(`Falha ao salvar versões do GTM: ${error.message}`);
}
