import "server-only";

import {
  getLeadById,
  type ListLeadsOptions,
  listAllLeadsForPipeline,
  listLeads,
  listOwnerOptions,
} from "@/repositories/crm/leadsRepository";
import {
  getSourceLeadAttribution,
  listMaterialDownloadsByEmail,
} from "@/repositories/crm/marketingRepository";
import { listPipelineStages } from "@/repositories/crm/pipelineStagesRepository";
import { getOpenStageEntriesForLeads } from "@/repositories/crm/stageHistoryRepository";
import { getNextTasksForLeads } from "@/repositories/crm/tasksRepository";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { CrmLeadWithRelations, PipelineColumn, PipelineStage } from "@/types/crm";

export interface LeadsPageData {
  leads: CrmLeadWithRelations[];
  total: number;
  stages: PipelineStage[];
  owners: { id: string; name: string | null; email: string | null }[];
}

export async function getLeadsPageData(options: ListLeadsOptions = {}): Promise<LeadsPageData> {
  const supabase = await getSupabaseAuthClient();
  const [{ leads, total }, stages, owners] = await Promise.all([
    listLeads(supabase, options),
    listPipelineStages(supabase),
    listOwnerOptions(supabase),
  ]);

  return { leads, total, stages, owners };
}

export async function getOwnerOptions() {
  const supabase = await getSupabaseAuthClient();
  return listOwnerOptions(supabase);
}

export async function getPipelineData(): Promise<{ columns: PipelineColumn[] }> {
  const supabase = await getSupabaseAuthClient();
  const [stages, leads] = await Promise.all([
    listPipelineStages(supabase),
    listAllLeadsForPipeline(supabase),
  ]);

  const leadIds = leads.map((lead) => lead.id);
  const [stageEntries, nextTasks] = await Promise.all([
    getOpenStageEntriesForLeads(supabase, leadIds),
    getNextTasksForLeads(supabase, leadIds),
  ]);

  const leadsWithPipelineInfo = leads.map((lead) => ({
    ...lead,
    stageEnteredAt: stageEntries.get(lead.id)?.enteredAt ?? null,
    nextTask: nextTasks.get(lead.id) ?? null,
  }));

  const columns: PipelineColumn[] = stages.map((stage) => ({
    stage,
    leads: leadsWithPipelineInfo.filter((lead) => lead.stageId === stage.id),
  }));

  return { columns };
}

/** Header-level data for the Lead Workspace: the lead itself plus the two
 * small, always-visible right-panel cards (attribution, downloads). Notes,
 * tasks, files and the timeline are each fetched lazily by their own tab the
 * first time it's opened — never eagerly here — so opening the Drawer stays
 * cheap regardless of how much history a lead has accumulated. */
export interface LeadDetailData {
  lead: CrmLeadWithRelations;
  sourceAttribution: Awaited<ReturnType<typeof getSourceLeadAttribution>>;
  materialDownloads: Awaited<ReturnType<typeof listMaterialDownloadsByEmail>>;
  owners: { id: string; name: string | null; email: string | null }[];
  stages: PipelineStage[];
}

export async function getLeadDetailData(leadId: string): Promise<LeadDetailData | null> {
  const supabase = await getSupabaseAuthClient();
  const lead = await getLeadById(supabase, leadId);
  if (!lead) return null;

  const [sourceAttribution, materialDownloads, owners, stages] = await Promise.all([
    lead.sourceLeadId
      ? getSourceLeadAttribution(supabase, lead.sourceLeadId)
      : Promise.resolve(null),
    lead.email ? listMaterialDownloadsByEmail(supabase, lead.email) : Promise.resolve([]),
    listOwnerOptions(supabase),
    listPipelineStages(supabase),
  ]);

  return { lead, sourceAttribution, materialDownloads, owners, stages };
}
