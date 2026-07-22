import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { type ClientWithOwnerRow, mapClient, mapClientWithOwner } from "@/repositories/crm/mappers";
import type { ClientRecord, ClientStatus, ClientWithOwner } from "@/types/crm";

const CLIENT_WITH_OWNER_SELECT = `
  id, created_at, updated_at, source_crm_lead_id, company, name, email, phone, owner_id, status, created_by,
  owner:profiles!clients_owner_id_fkey (id, name, email)
`;

export interface ListClientsOptions {
  search?: string;
  status?: ClientStatus;
}

export async function listClients(
  supabase: SupabaseClient,
  options: ListClientsOptions = {},
): Promise<ClientWithOwner[]> {
  let query = supabase.from("clients").select(CLIENT_WITH_OWNER_SELECT);

  if (options.status) query = query.eq("status", options.status);
  if (options.search) {
    const term = options.search.replace(/[,()%]/g, " ").trim();
    if (term) {
      query = query.or(`company.ilike.%${term}%,name.ilike.%${term}%,email.ilike.%${term}%`);
    }
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw new Error(`Falha ao carregar clientes: ${error.message}`);

  return ((data ?? []) as unknown as ClientWithOwnerRow[]).map(mapClientWithOwner);
}

export async function getClientById(
  supabase: SupabaseClient,
  id: string,
): Promise<ClientWithOwner | null> {
  const { data, error } = await supabase
    .from("clients")
    .select(CLIENT_WITH_OWNER_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Falha ao carregar cliente: ${error.message}`);
  if (!data) return null;
  return mapClientWithOwner(data as unknown as ClientWithOwnerRow);
}

export async function getClientBySourceLeadId(
  supabase: SupabaseClient,
  crmLeadId: string,
): Promise<ClientRecord | null> {
  const { data, error } = await supabase
    .from("clients")
    .select(
      "id, created_at, updated_at, source_crm_lead_id, company, name, email, phone, owner_id, status, created_by",
    )
    .eq("source_crm_lead_id", crmLeadId)
    .maybeSingle();

  if (error) throw new Error(`Falha ao verificar cliente do lead: ${error.message}`);
  if (!data) return null;
  return mapClient(data);
}

export async function countClients(
  supabase: SupabaseClient,
  status?: ClientStatus,
): Promise<number> {
  let query = supabase.from("clients").select("*", { count: "exact", head: true });
  if (status) query = query.eq("status", status);
  const { count, error } = await query;
  if (error) throw new Error(`Falha ao contar clientes: ${error.message}`);
  return count ?? 0;
}

export async function countClientsSince(
  supabase: SupabaseClient,
  sinceIso: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("clients")
    .select("*", { count: "exact", head: true })
    .gte("created_at", sinceIso);
  if (error) throw new Error(`Falha ao contar novos clientes: ${error.message}`);
  return count ?? 0;
}

export interface CreateClientPayload {
  company: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  ownerId?: string | null;
  status?: ClientStatus;
  sourceCrmLeadId?: string | null;
  createdBy: string;
}

export async function createClient(
  supabase: SupabaseClient,
  payload: CreateClientPayload,
): Promise<ClientRecord> {
  const { data, error } = await supabase
    .from("clients")
    .insert({
      company: payload.company,
      name: payload.name ?? null,
      email: payload.email ?? null,
      phone: payload.phone ?? null,
      owner_id: payload.ownerId ?? null,
      status: payload.status ?? "ativo",
      source_crm_lead_id: payload.sourceCrmLeadId ?? null,
      created_by: payload.createdBy,
    })
    .select(
      "id, created_at, updated_at, source_crm_lead_id, company, name, email, phone, owner_id, status, created_by",
    )
    .single();

  if (error) throw new Error(`Falha ao criar cliente: ${error.message}`);
  return mapClient(data);
}

export interface UpdateClientPayload {
  company?: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  ownerId?: string | null;
  status?: ClientStatus;
}

export async function updateClient(
  supabase: SupabaseClient,
  clientId: string,
  patch: UpdateClientPayload,
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (patch.company !== undefined) payload.company = patch.company;
  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.email !== undefined) payload.email = patch.email;
  if (patch.phone !== undefined) payload.phone = patch.phone;
  if (patch.ownerId !== undefined) payload.owner_id = patch.ownerId;
  if (patch.status !== undefined) payload.status = patch.status;

  const { error } = await supabase.from("clients").update(payload).eq("id", clientId);
  if (error) throw new Error(`Falha ao atualizar cliente: ${error.message}`);
}
