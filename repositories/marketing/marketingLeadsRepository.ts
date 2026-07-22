import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/** Core dataset every Marketing Intelligence dashboard is derived from: a
 * crm_lead joined with its stage, owner, marketing attribution (via
 * source_lead_id -> public.leads — null for manually-created leads) and,
 * when it converted, the client it produced (clients.source_crm_lead_id).
 * No dashboard queries these tables directly — everything goes through
 * application/marketingAnalytics, which calls this repository once and
 * derives every dashboard's shape from the same rows. */
const MARKETING_LEAD_SELECT = `
  id, created_at, updated_at, source_lead_id, name, company, city, origin, stage_id, owner_id,
  potential_value, score, lost_reason, lost_at, last_interaction_at,
  stage:pipeline_stages!crm_leads_stage_id_fkey (id, key, label, color, position, is_won),
  owner:profiles!crm_leads_owner_id_fkey (id, name, email),
  source_lead:leads!crm_leads_source_lead_id_fkey (
    id, utm_source, utm_medium, utm_campaign, utm_content, utm_term,
    gclid, fbclid, msclkid, ttclid, landing_page, referer, first_visit, last_visit
  ),
  clients:clients!clients_source_crm_lead_id_fkey (id, created_at, status)
`;

export interface MarketingLeadSourceRow {
  id: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  gclid: string | null;
  fbclid: string | null;
  msclkid: string | null;
  ttclid: string | null;
  landing_page: string | null;
  referer: string | null;
  first_visit: string | null;
  last_visit: string | null;
}

export interface MarketingClientRow {
  id: string;
  created_at: string;
  status: string;
}

export interface MarketingLeadRow {
  id: string;
  created_at: string;
  updated_at: string;
  source_lead_id: string | null;
  name: string;
  company: string | null;
  city: string | null;
  origin: string | null;
  stage_id: string;
  owner_id: string | null;
  potential_value: number | null;
  score: number;
  lost_reason: string | null;
  lost_at: string | null;
  last_interaction_at: string | null;
  stage: {
    id: string;
    key: string;
    label: string;
    color: string;
    position: number;
    is_won: boolean;
  };
  owner: { id: string; name: string | null; email: string | null } | null;
  source_lead: MarketingLeadSourceRow | null;
  clients: MarketingClientRow[];
}

export interface MarketingDatasetFilters {
  createdFrom?: string;
  createdTo?: string;
  ownerId?: string;
  city?: string;
  stageId?: string;
  status?: "aberto" | "ganho" | "perdido";
}

export async function listMarketingLeads(
  supabase: SupabaseClient,
  filters: MarketingDatasetFilters = {},
): Promise<MarketingLeadRow[]> {
  let query = supabase.from("crm_leads").select(MARKETING_LEAD_SELECT);

  if (filters.createdFrom) query = query.gte("created_at", filters.createdFrom);
  if (filters.createdTo) query = query.lte("created_at", filters.createdTo);
  if (filters.ownerId) query = query.eq("owner_id", filters.ownerId);
  if (filters.city) query = query.ilike("city", `%${filters.city}%`);
  if (filters.stageId) query = query.eq("stage_id", filters.stageId);
  if (filters.status === "perdido") query = query.not("lost_reason", "is", null);
  if (filters.status === "aberto") query = query.is("lost_reason", null);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error)
    throw new Error(`Falha ao carregar leads para o Marketing Intelligence: ${error.message}`);

  const rows = (data ?? []) as unknown as MarketingLeadRow[];
  // "ganho" filtered in JS rather than via a `stage!inner` select variant —
  // dataset sizes here don't justify a second query shape.
  return filters.status === "ganho" ? rows.filter((row) => row.stage.is_won) : rows;
}
