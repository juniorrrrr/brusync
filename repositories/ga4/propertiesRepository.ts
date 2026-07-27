import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Ga4ConnectionStatus, Ga4Property } from "@/types/ga4";

interface PropertyRow {
  id: string;
  property_id: string;
  display_name: string | null;
  time_zone: string | null;
  currency_code: string | null;
  is_synced: boolean;
  status: Ga4ConnectionStatus;
  last_sync_at: string | null;
  error: string | null;
  client_id: string | null;
  responsible_id: string | null;
  created_at: string;
  updated_at: string;
}

const PROPERTY_SELECT =
  "id, property_id, display_name, time_zone, currency_code, is_synced, status, last_sync_at, error, client_id, responsible_id, created_at, updated_at";

function mapProperty(row: PropertyRow): Ga4Property {
  return {
    id: row.id,
    propertyId: row.property_id,
    displayName: row.display_name,
    timeZone: row.time_zone,
    currencyCode: row.currency_code,
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

export async function getSyncedGa4Property(supabase: SupabaseClient): Promise<Ga4Property | null> {
  const { data, error } = await supabase
    .from("ga4_properties")
    .select(PROPERTY_SELECT)
    .eq("is_synced", true)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Falha ao carregar propriedade do GA4: ${error.message}`);
  return data ? mapProperty(data as PropertyRow) : null;
}

export async function getGa4PropertyById(
  supabase: SupabaseClient,
  id: string,
): Promise<Ga4Property | null> {
  const { data, error } = await supabase
    .from("ga4_properties")
    .select(PROPERTY_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Falha ao carregar propriedade do GA4: ${error.message}`);
  return data ? mapProperty(data as PropertyRow) : null;
}

export async function listUnselectedGa4Properties(
  supabase: SupabaseClient,
): Promise<Ga4Property[]> {
  const { data, error } = await supabase
    .from("ga4_properties")
    .select(PROPERTY_SELECT)
    .eq("is_synced", false)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Falha ao listar propriedades do GA4: ${error.message}`);
  return ((data ?? []) as PropertyRow[]).map(mapProperty);
}

export interface UpsertGa4PropertyPayload {
  propertyId: string;
  displayName: string | null;
  timeZone: string | null;
  currencyCode: string | null;
  createdBy: string | null;
}

export async function upsertGa4Property(
  supabase: SupabaseClient,
  payload: UpsertGa4PropertyPayload,
): Promise<Ga4Property> {
  const { data, error } = await supabase
    .from("ga4_properties")
    .upsert(
      {
        property_id: payload.propertyId,
        display_name: payload.displayName,
        time_zone: payload.timeZone,
        currency_code: payload.currencyCode,
        created_by: payload.createdBy,
      },
      { onConflict: "property_id" },
    )
    .select(PROPERTY_SELECT)
    .single();
  if (error) throw new Error(`Falha ao salvar propriedade do GA4: ${error.message}`);
  return mapProperty(data as PropertyRow);
}

export async function selectGa4Property(
  supabase: SupabaseClient,
  propertyId: string,
): Promise<void> {
  const { error: clearError } = await supabase
    .from("ga4_properties")
    .update({ is_synced: false })
    .eq("is_synced", true);
  if (clearError) throw new Error(`Falha ao trocar propriedade selecionada: ${clearError.message}`);

  const { error } = await supabase
    .from("ga4_properties")
    .update({ is_synced: true, status: "conectado", last_sync_at: new Date().toISOString() })
    .eq("id", propertyId);
  if (error) throw new Error(`Falha ao selecionar propriedade do GA4: ${error.message}`);
}

export async function setGa4PropertyStatus(
  supabase: SupabaseClient,
  id: string,
  status: Ga4ConnectionStatus,
  patch: { error?: string | null } = {},
): Promise<void> {
  const row: Record<string, unknown> = { status };
  if (status === "conectado") row.last_sync_at = new Date().toISOString();
  if (patch.error !== undefined) row.error = patch.error;

  const { error } = await supabase.from("ga4_properties").update(row).eq("id", id);
  if (error) throw new Error(`Falha ao atualizar status da propriedade: ${error.message}`);
}

export async function setGa4PropertyUnsynced(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase
    .from("ga4_properties")
    .update({ is_synced: false, status: "desconectado" })
    .eq("id", id);
  if (error) throw new Error(`Falha ao desconectar propriedade do GA4: ${error.message}`);
}

export async function setGa4PropertyCrmLink(
  supabase: SupabaseClient,
  id: string,
  clientId: string | null,
  responsibleId: string | null,
): Promise<void> {
  const { error } = await supabase
    .from("ga4_properties")
    .update({ client_id: clientId, responsible_id: responsibleId })
    .eq("id", id);
  if (error) throw new Error(`Falha ao vincular propriedade ao CRM: ${error.message}`);
}
