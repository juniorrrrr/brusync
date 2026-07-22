import "server-only";

import { buildCampaignKey } from "@/domain/marketing/campaignKey";
import { classifyMarketingOrigin } from "@/domain/marketing/originRules";
import { listPipelineStages } from "@/repositories/crm/pipelineStagesRepository";
import {
  listMarketingLeads,
  type MarketingDatasetFilters,
} from "@/repositories/marketing/marketingLeadsRepository";
import { getWonStageEnteredAtForLeads } from "@/repositories/marketing/wonTimingRepository";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { BadgeTone } from "@/types/crm";
import type { MarketingOrigin } from "@/types/marketing";

/** One row per crm_lead, flattened and enriched with everything every
 * Marketing Intelligence dashboard needs — the single dataset every
 * dashboard-specific query file in this layer derives its shape from. No
 * file outside `application/marketingAnalytics` and `repositories/marketing`
 * queries these tables directly. */
export interface EnrichedLead {
  id: string;
  createdAt: string;
  name: string;
  company: string | null;
  city: string | null;
  ownerId: string | null;
  ownerName: string | null;
  stageId: string;
  stageKey: string;
  stageLabel: string;
  stageColor: BadgeTone;
  stagePosition: number;
  isWon: boolean;
  isLost: boolean;
  isQualifiedOrBeyond: boolean;
  isProposalOrBeyond: boolean;
  potentialValue: number | null;
  /** potential_value when the lead reached the won stage, 0 otherwise — see
   * Fase 5 schema notes: there is no separate "closed deal value" field. */
  revenue: number;
  clientCreatedAt: string | null;
  wonEnteredAt: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  landingPage: string | null;
  referer: string | null;
  gclid: string | null;
  fbclid: string | null;
  msclkid: string | null;
  ttclid: string | null;
  origin: MarketingOrigin;
  campaignKey: string;
  hasAttribution: boolean;
}

export interface MarketingDataset {
  leads: EnrichedLead[];
  qualifiedStagePosition: number;
  proposalStagePosition: number;
  wonStageId: string | null;
}

/** DB-level filters (MarketingDatasetFilters) narrow the SQL query itself;
 * `origin` and `campaignSearch` are derived/free-text fields computed only
 * after enrichment, so they're applied as a JS-level filter on the resulting
 * `leads` array instead. Every "Filtros Globais" field lives on one of these
 * two, so every dashboard filters identically. */
export interface MarketingQueryFilters extends MarketingDatasetFilters {
  origin?: MarketingOrigin;
  /** Substring match (case-insensitive) against utm_campaign. */
  campaignSearch?: string;
}

export async function getMarketingDataset(
  filters: MarketingQueryFilters = {},
): Promise<MarketingDataset> {
  const { origin: originFilter, campaignSearch, ...dbFilters } = filters;
  const campaignSearchTerm = campaignSearch?.trim().toLowerCase();
  const supabase = await getSupabaseAuthClient();
  const [stages, rows] = await Promise.all([
    listPipelineStages(supabase),
    listMarketingLeads(supabase, dbFilters),
  ]);

  const qualifiedStage = stages.find((stage) => stage.key === "qualificado");
  const proposalStage = stages.find((stage) => stage.key === "proposta");
  const wonStage = stages.find((stage) => stage.isWon);
  const qualifiedStagePosition = qualifiedStage?.position ?? Number.POSITIVE_INFINITY;
  const proposalStagePosition = proposalStage?.position ?? Number.POSITIVE_INFINITY;

  // Won-stage entered_at (needed for "tempo médio até venda") is fetched
  // separately from crm_lead_stage_history, scoped to this exact lead set —
  // done here, once, so every downstream query shares the same numbers.
  const wonEnteredAtByLead = wonStage
    ? await getWonStageEnteredAtForLeads(
        supabase,
        rows.map((row) => row.id),
        wonStage.id,
      )
    : new Map<string, string>();

  const leads: EnrichedLead[] = rows.map((row) => {
    const isWon = row.stage.is_won;
    const isLost = row.lost_reason !== null;
    const sourceLead = row.source_lead;
    const client = row.clients[0] ?? null;

    return {
      id: row.id,
      createdAt: row.created_at,
      name: row.name,
      company: row.company,
      city: row.city,
      ownerId: row.owner_id,
      ownerName: row.owner?.name ?? row.owner?.email ?? null,
      stageId: row.stage_id,
      stageKey: row.stage.key,
      stageLabel: row.stage.label,
      stageColor: row.stage.color as BadgeTone,
      stagePosition: row.stage.position,
      isWon,
      isLost,
      isQualifiedOrBeyond: row.stage.position >= qualifiedStagePosition,
      isProposalOrBeyond: row.stage.position >= proposalStagePosition,
      potentialValue: row.potential_value,
      revenue: isWon ? (row.potential_value ?? 0) : 0,
      clientCreatedAt: client?.created_at ?? null,
      wonEnteredAt: wonEnteredAtByLead.get(row.id) ?? null,
      utmSource: sourceLead?.utm_source ?? null,
      utmMedium: sourceLead?.utm_medium ?? null,
      utmCampaign: sourceLead?.utm_campaign ?? null,
      utmContent: sourceLead?.utm_content ?? null,
      utmTerm: sourceLead?.utm_term ?? null,
      landingPage: sourceLead?.landing_page ?? null,
      referer: sourceLead?.referer ?? null,
      gclid: sourceLead?.gclid ?? null,
      fbclid: sourceLead?.fbclid ?? null,
      msclkid: sourceLead?.msclkid ?? null,
      ttclid: sourceLead?.ttclid ?? null,
      hasAttribution: sourceLead !== null,
      origin: classifyMarketingOrigin({
        utmSource: sourceLead?.utm_source ?? null,
        utmMedium: sourceLead?.utm_medium ?? null,
        referer: sourceLead?.referer ?? null,
        gclid: sourceLead?.gclid ?? null,
        fbclid: sourceLead?.fbclid ?? null,
        msclkid: sourceLead?.msclkid ?? null,
        ttclid: sourceLead?.ttclid ?? null,
        manualOrigin: row.origin,
      }),
      campaignKey: buildCampaignKey({
        utmSource: sourceLead?.utm_source ?? null,
        utmCampaign: sourceLead?.utm_campaign ?? null,
      }),
    };
  });

  const filteredLeads = leads.filter(
    (lead) =>
      (!originFilter || lead.origin === originFilter) &&
      (!campaignSearchTerm ||
        (lead.utmCampaign?.toLowerCase().includes(campaignSearchTerm) ?? false)),
  );

  return {
    leads: filteredLeads,
    qualifiedStagePosition,
    proposalStagePosition,
    wonStageId: wonStage?.id ?? null,
  };
}

export function groupBy<T, K>(items: T[], keyFn: (item: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    const list = map.get(key);
    if (list) list.push(item);
    else map.set(key, [item]);
  }
  return map;
}
