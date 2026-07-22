import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Integration, IntegrationCategory, IntegrationStatus } from "@/types/integrations";

interface IntegrationRow {
  id: string;
  provider: string;
  category: IntegrationCategory;
  name: string;
  description: string | null;
  status: IntegrationStatus;
  enabled: boolean;
  connected_at: string | null;
  last_sync: string | null;
  next_sync: string | null;
  config: Record<string, unknown> | null;
  error: string | null;
  health_score: number | null;
  created_at: string;
  updated_at: string;
}

const INTEGRATION_SELECT =
  "id, provider, category, name, description, status, enabled, connected_at, last_sync, next_sync, config, error, health_score, created_at, updated_at";

function mapIntegration(row: IntegrationRow): Integration {
  return {
    id: row.id,
    provider: row.provider,
    category: row.category,
    name: row.name,
    description: row.description,
    status: row.status,
    enabled: row.enabled,
    connectedAt: row.connected_at,
    lastSync: row.last_sync,
    nextSync: row.next_sync,
    config: row.config ?? {},
    error: row.error,
    healthScore: row.health_score,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface ListIntegrationsOptions {
  category?: IntegrationCategory;
  status?: IntegrationStatus;
  search?: string;
}

export async function listIntegrations(
  supabase: SupabaseClient,
  options: ListIntegrationsOptions = {},
): Promise<Integration[]> {
  let query = supabase.from("integrations").select(INTEGRATION_SELECT);

  if (options.category) query = query.eq("category", options.category);
  if (options.status) query = query.eq("status", options.status);
  if (options.search) {
    const term = options.search.replace(/[,()%]/g, " ").trim();
    if (term) query = query.or(`name.ilike.%${term}%,provider.ilike.%${term}%`);
  }

  const { data, error } = await query.order("category").order("name");
  if (error) throw new Error(`Falha ao carregar integrações: ${error.message}`);
  return ((data ?? []) as unknown as IntegrationRow[]).map(mapIntegration);
}

export async function getIntegrationByProvider(
  supabase: SupabaseClient,
  provider: string,
): Promise<Integration | null> {
  const { data, error } = await supabase
    .from("integrations")
    .select(INTEGRATION_SELECT)
    .eq("provider", provider)
    .maybeSingle();
  if (error) throw new Error(`Falha ao carregar integração: ${error.message}`);
  return data ? mapIntegration(data as unknown as IntegrationRow) : null;
}

export interface UpdateIntegrationPayload {
  enabled?: boolean;
  status?: IntegrationStatus;
  config?: Record<string, unknown>;
  error?: string | null;
}

export async function updateIntegration(
  supabase: SupabaseClient,
  provider: string,
  patch: UpdateIntegrationPayload,
): Promise<void> {
  const { error } = await supabase.from("integrations").update(patch).eq("provider", provider);
  if (error) throw new Error(`Falha ao atualizar integração: ${error.message}`);
}
