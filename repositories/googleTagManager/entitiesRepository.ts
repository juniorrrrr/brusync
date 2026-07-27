import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { GtmEntity, GtmEntityType } from "@/types/gtm";

interface EntityRow {
  id: string;
  container_id: string;
  entity_type: GtmEntityType;
  external_id: string;
  workspace_external_id: string | null;
  name: string | null;
  type: string | null;
  status: string | null;
}

const ENTITY_SELECT =
  "id, container_id, entity_type, external_id, workspace_external_id, name, type, status";

function mapEntity(row: EntityRow): GtmEntity {
  return {
    id: row.id,
    containerId: row.container_id,
    entityType: row.entity_type,
    externalId: row.external_id,
    workspaceExternalId: row.workspace_external_id,
    name: row.name,
    type: row.type,
    status: row.status,
  };
}

export async function listGtmEntities(
  supabase: SupabaseClient,
  containerId: string,
  entityType?: GtmEntityType,
): Promise<GtmEntity[]> {
  let query = supabase.from("gtm_entities").select(ENTITY_SELECT).eq("container_id", containerId);
  if (entityType) query = query.eq("entity_type", entityType);
  const { data, error } = await query.order("name");
  if (error) throw new Error(`Falha ao carregar entidades do GTM: ${error.message}`);
  return ((data ?? []) as EntityRow[]).map(mapEntity);
}

export async function countGtmEntitiesByType(
  supabase: SupabaseClient,
  containerId: string,
): Promise<Record<GtmEntityType, number>> {
  const { data, error } = await supabase
    .from("gtm_entities")
    .select("entity_type")
    .eq("container_id", containerId);
  if (error) throw new Error(`Falha ao contar entidades do GTM: ${error.message}`);

  const counts: Record<GtmEntityType, number> = { workspace: 0, tag: 0, trigger: 0, variable: 0 };
  for (const row of (data ?? []) as { entity_type: GtmEntityType }[]) counts[row.entity_type] += 1;
  return counts;
}

export interface UpsertGtmEntityRow {
  entityType: GtmEntityType;
  externalId: string;
  workspaceExternalId: string | null;
  name: string | null;
  type: string | null;
  status: string | null;
}

export async function upsertGtmEntities(
  supabase: SupabaseClient,
  containerId: string,
  rows: UpsertGtmEntityRow[],
): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await supabase.from("gtm_entities").upsert(
    rows.map((row) => ({
      container_id: containerId,
      entity_type: row.entityType,
      external_id: row.externalId,
      workspace_external_id: row.workspaceExternalId,
      name: row.name,
      type: row.type,
      status: row.status,
    })),
    { onConflict: "container_id,entity_type,external_id" },
  );
  if (error) throw new Error(`Falha ao salvar entidades do GTM: ${error.message}`);
}
