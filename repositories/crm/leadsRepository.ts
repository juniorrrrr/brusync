import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  type CrmLeadWithRelationsRow,
  mapCrmLead,
  mapCrmLeadWithRelations,
} from "@/repositories/crm/mappers";
import type { CrmLead, CrmLeadWithRelations } from "@/types/crm";

const LEAD_WITH_RELATIONS_SELECT = `
  id, created_at, updated_at, source_lead_id, name, company, email, phone, origin,
  stage_id, owner_id, potential_value, score, tags, last_interaction_at, created_by,
  stage:pipeline_stages!crm_leads_stage_id_fkey (id, key, label, color, position, is_won),
  owner:profiles!crm_leads_owner_id_fkey (id, name, email)
`;

/** Strips characters that would break a PostgREST `.or()` filter string —
 * search input is untrusted, and commas/parens have syntactic meaning there. */
function sanitizeSearchTerm(term: string) {
  return term.replace(/[,()%]/g, " ").trim();
}

export interface ListLeadsOptions {
  search?: string;
  stageId?: string;
  ownerId?: string;
  sortBy?: "created_at" | "name" | "potential_value" | "score" | "last_interaction_at";
  sortDir?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

export async function listLeads(
  supabase: SupabaseClient,
  options: ListLeadsOptions = {},
): Promise<{ leads: CrmLeadWithRelations[]; total: number }> {
  const {
    search,
    stageId,
    ownerId,
    sortBy = "created_at",
    sortDir = "desc",
    limit = 50,
    offset = 0,
  } = options;

  let query = supabase.from("crm_leads").select(LEAD_WITH_RELATIONS_SELECT, { count: "exact" });

  if (stageId) query = query.eq("stage_id", stageId);
  if (ownerId) query = query.eq("owner_id", ownerId);
  if (search) {
    const term = sanitizeSearchTerm(search);
    if (term) {
      query = query.or(`name.ilike.%${term}%,company.ilike.%${term}%,email.ilike.%${term}%`);
    }
  }

  query = query.order(sortBy, { ascending: sortDir === "asc" }).range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(`Falha ao carregar leads: ${error.message}`);

  return {
    leads: ((data ?? []) as unknown as CrmLeadWithRelationsRow[]).map(mapCrmLeadWithRelations),
    total: count ?? 0,
  };
}

export async function listAllLeadsForPipeline(
  supabase: SupabaseClient,
): Promise<CrmLeadWithRelations[]> {
  const { data, error } = await supabase
    .from("crm_leads")
    .select(LEAD_WITH_RELATIONS_SELECT)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Falha ao carregar pipeline: ${error.message}`);

  return ((data ?? []) as unknown as CrmLeadWithRelationsRow[]).map(mapCrmLeadWithRelations);
}

export async function getLeadById(
  supabase: SupabaseClient,
  id: string,
): Promise<CrmLeadWithRelations | null> {
  const { data, error } = await supabase
    .from("crm_leads")
    .select(LEAD_WITH_RELATIONS_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Falha ao carregar lead: ${error.message}`);
  if (!data) return null;

  return mapCrmLeadWithRelations(data as unknown as CrmLeadWithRelationsRow);
}

export interface CreateLeadPayload {
  name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  origin?: string | null;
  stageId: string;
  ownerId?: string | null;
  potentialValue?: number | null;
  tags?: string[];
  sourceLeadId?: string | null;
  createdBy: string;
}

export async function createLead(
  supabase: SupabaseClient,
  payload: CreateLeadPayload,
): Promise<CrmLead> {
  const { data, error } = await supabase
    .from("crm_leads")
    .insert({
      name: payload.name,
      company: payload.company ?? null,
      email: payload.email ?? null,
      phone: payload.phone ?? null,
      origin: payload.origin ?? null,
      stage_id: payload.stageId,
      owner_id: payload.ownerId ?? null,
      potential_value: payload.potentialValue ?? null,
      tags: payload.tags ?? [],
      source_lead_id: payload.sourceLeadId ?? null,
      created_by: payload.createdBy,
    })
    .select(
      "id, created_at, updated_at, source_lead_id, name, company, email, phone, origin, stage_id, owner_id, potential_value, score, tags, last_interaction_at, created_by",
    )
    .single();

  if (error) throw new Error(`Falha ao criar lead: ${error.message}`);

  return mapCrmLead(data);
}

export interface UpdateLeadPayload {
  name?: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  origin?: string | null;
  ownerId?: string | null;
  potentialValue?: number | null;
  score?: number;
  tags?: string[];
}

export async function updateLead(
  supabase: SupabaseClient,
  leadId: string,
  patch: UpdateLeadPayload,
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.company !== undefined) payload.company = patch.company;
  if (patch.email !== undefined) payload.email = patch.email;
  if (patch.phone !== undefined) payload.phone = patch.phone;
  if (patch.origin !== undefined) payload.origin = patch.origin;
  if (patch.ownerId !== undefined) payload.owner_id = patch.ownerId;
  if (patch.potentialValue !== undefined) payload.potential_value = patch.potentialValue;
  if (patch.score !== undefined) payload.score = patch.score;
  if (patch.tags !== undefined) payload.tags = patch.tags;

  const { error } = await supabase.from("crm_leads").update(payload).eq("id", leadId);
  if (error) throw new Error(`Falha ao atualizar lead: ${error.message}`);
}

export async function touchLeadInteraction(
  supabase: SupabaseClient,
  leadId: string,
): Promise<void> {
  const { error } = await supabase
    .from("crm_leads")
    .update({ last_interaction_at: new Date().toISOString() })
    .eq("id", leadId);

  if (error) throw new Error(`Falha ao atualizar última interação: ${error.message}`);
}

export async function updateLeadStage(
  supabase: SupabaseClient,
  leadId: string,
  stageId: string,
): Promise<void> {
  const { error } = await supabase
    .from("crm_leads")
    .update({ stage_id: stageId, last_interaction_at: new Date().toISOString() })
    .eq("id", leadId);

  if (error) throw new Error(`Falha ao mover lead de estágio: ${error.message}`);
}

export interface BulkUpdatePatch {
  stageId?: string;
  ownerId?: string;
}

export async function bulkUpdateLeads(
  supabase: SupabaseClient,
  leadIds: string[],
  patch: BulkUpdatePatch,
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (patch.stageId !== undefined) {
    payload.stage_id = patch.stageId;
    payload.last_interaction_at = new Date().toISOString();
  }
  if (patch.ownerId !== undefined) payload.owner_id = patch.ownerId;

  if (Object.keys(payload).length === 0) return;

  const { error } = await supabase.from("crm_leads").update(payload).in("id", leadIds);
  if (error) throw new Error(`Falha ao atualizar leads em lote: ${error.message}`);
}

export async function listOwnerOptions(
  supabase: SupabaseClient,
): Promise<{ id: string; name: string | null; email: string | null }[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, email")
    .in("role", ["administrador", "gestor", "comercial", "atendimento"])
    .order("name", { ascending: true });

  if (error) throw new Error(`Falha ao carregar responsáveis: ${error.message}`);
  return data ?? [];
}
