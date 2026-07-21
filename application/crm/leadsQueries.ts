import "server-only";

import { listActivitiesForLead } from "@/repositories/crm/activitiesRepository";
import { listFilesForLead } from "@/repositories/crm/filesRepository";
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

  const columns: PipelineColumn[] = stages.map((stage) => ({
    stage,
    leads: leads.filter((lead) => lead.stageId === stage.id),
  }));

  return { columns };
}

export interface LeadDetailData {
  lead: CrmLeadWithRelations;
  activities: Awaited<ReturnType<typeof listActivitiesForLead>>;
  files: Awaited<ReturnType<typeof listFilesForLead>>;
  sourceAttribution: Awaited<ReturnType<typeof getSourceLeadAttribution>>;
  materialDownloads: Awaited<ReturnType<typeof listMaterialDownloadsByEmail>>;
  owners: { id: string; name: string | null; email: string | null }[];
}

export async function getLeadDetailData(leadId: string): Promise<LeadDetailData | null> {
  const supabase = await getSupabaseAuthClient();
  const lead = await getLeadById(supabase, leadId);
  if (!lead) return null;

  const [activities, files, sourceAttribution, materialDownloads, owners] = await Promise.all([
    listActivitiesForLead(supabase, leadId),
    listFilesForLead(supabase, leadId),
    lead.sourceLeadId
      ? getSourceLeadAttribution(supabase, lead.sourceLeadId)
      : Promise.resolve(null),
    lead.email ? listMaterialDownloadsByEmail(supabase, lead.email) : Promise.resolve([]),
    listOwnerOptions(supabase),
  ]);

  return { lead, activities, files, sourceAttribution, materialDownloads, owners };
}
