import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { GtmConnectionStatus, GtmContainer } from "@/types/gtm";

interface ContainerRow {
  id: string;
  container_id: string;
  account_id_external: string | null;
  name: string | null;
  public_id: string | null;
  usage_context: string[];
  is_synced: boolean;
  status: GtmConnectionStatus;
  last_sync_at: string | null;
  error: string | null;
  client_id: string | null;
  responsible_id: string | null;
  created_at: string;
  updated_at: string;
}

const CONTAINER_SELECT =
  "id, container_id, account_id_external, name, public_id, usage_context, is_synced, status, last_sync_at, error, client_id, responsible_id, created_at, updated_at";

function mapContainer(row: ContainerRow): GtmContainer {
  return {
    id: row.id,
    containerId: row.container_id,
    accountIdExternal: row.account_id_external,
    name: row.name,
    publicId: row.public_id,
    usageContext: row.usage_context ?? [],
    isSynced: row.is_synced,
    status: row.status,
    lastSyncAt: row.last_sync_at,
    error: row.error,
    clientId: row.client_id,
    responsibleId: row.responsible_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getSyncedGtmContainer(
  supabase: SupabaseClient,
): Promise<GtmContainer | null> {
  const { data, error } = await supabase
    .from("gtm_containers")
    .select(CONTAINER_SELECT)
    .eq("is_synced", true)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Falha ao carregar container do GTM: ${error.message}`);
  return data ? mapContainer(data as ContainerRow) : null;
}

export async function getGtmContainerById(
  supabase: SupabaseClient,
  id: string,
): Promise<GtmContainer | null> {
  const { data, error } = await supabase
    .from("gtm_containers")
    .select(CONTAINER_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Falha ao carregar container do GTM: ${error.message}`);
  return data ? mapContainer(data as ContainerRow) : null;
}

export async function listUnselectedGtmContainers(
  supabase: SupabaseClient,
): Promise<GtmContainer[]> {
  const { data, error } = await supabase
    .from("gtm_containers")
    .select(CONTAINER_SELECT)
    .eq("is_synced", false)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Falha ao listar containers do GTM: ${error.message}`);
  return ((data ?? []) as ContainerRow[]).map(mapContainer);
}

export interface UpsertGtmContainerPayload {
  containerId: string;
  accountIdExternal: string;
  name: string | null;
  publicId: string | null;
  usageContext: string[];
  createdBy: string | null;
}

export async function upsertGtmContainer(
  supabase: SupabaseClient,
  payload: UpsertGtmContainerPayload,
): Promise<GtmContainer> {
  const { data, error } = await supabase
    .from("gtm_containers")
    .upsert(
      {
        container_id: payload.containerId,
        account_id_external: payload.accountIdExternal,
        name: payload.name,
        public_id: payload.publicId,
        usage_context: payload.usageContext,
        created_by: payload.createdBy,
      },
      { onConflict: "container_id" },
    )
    .select(CONTAINER_SELECT)
    .single();
  if (error) throw new Error(`Falha ao salvar container do GTM: ${error.message}`);
  return mapContainer(data as ContainerRow);
}

export async function selectGtmContainer(
  supabase: SupabaseClient,
  containerId: string,
): Promise<void> {
  const { error: clearError } = await supabase
    .from("gtm_containers")
    .update({ is_synced: false })
    .eq("is_synced", true);
  if (clearError) throw new Error(`Falha ao trocar container selecionado: ${clearError.message}`);

  const { error } = await supabase
    .from("gtm_containers")
    .update({ is_synced: true, status: "conectado", last_sync_at: new Date().toISOString() })
    .eq("id", containerId);
  if (error) throw new Error(`Falha ao selecionar container do GTM: ${error.message}`);
}

export async function setGtmContainerStatus(
  supabase: SupabaseClient,
  id: string,
  status: GtmConnectionStatus,
  patch: { error?: string | null } = {},
): Promise<void> {
  const row: Record<string, unknown> = { status };
  if (status === "conectado") row.last_sync_at = new Date().toISOString();
  if (patch.error !== undefined) row.error = patch.error;

  const { error } = await supabase.from("gtm_containers").update(row).eq("id", id);
  if (error) throw new Error(`Falha ao atualizar status do container: ${error.message}`);
}

export async function setGtmContainerUnsynced(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase
    .from("gtm_containers")
    .update({ is_synced: false, status: "desconectado" })
    .eq("id", id);
  if (error) throw new Error(`Falha ao desconectar container do GTM: ${error.message}`);
}

export async function setGtmContainerCrmLink(
  supabase: SupabaseClient,
  id: string,
  clientId: string | null,
  responsibleId: string | null,
): Promise<void> {
  const { error } = await supabase
    .from("gtm_containers")
    .update({ client_id: clientId, responsible_id: responsibleId })
    .eq("id", id);
  if (error) throw new Error(`Falha ao vincular container ao CRM: ${error.message}`);
}
