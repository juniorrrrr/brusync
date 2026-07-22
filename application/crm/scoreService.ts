import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { computeLeadScore } from "@/domain/crm/scoreRules";
import { getLeadById, setLeadScore } from "@/repositories/crm/leadsRepository";
import { listMaterialDownloadsByEmail } from "@/repositories/crm/marketingRepository";
import { listPipelineStages } from "@/repositories/crm/pipelineStagesRepository";
import { getOpenStageEntry } from "@/repositories/crm/stageHistoryRepository";

/** Recomputes and persists a single lead's score from the rules in
 * domain/crm/scoreRules.ts. Called after every event that can move the
 * needle (lead created/edited, stage change, note/task/file interaction) and
 * whenever the Lead Workspace opens a lead — so score stays fresh for
 * whichever lead a user is actually looking at or acting on, without needing
 * a background job to catch the purely time-based penalties (days stuck,
 * no interaction) for leads nobody is currently viewing. List views (Pipeline
 * board, Leads table) show whatever was last persisted for each row. */
export async function recalculateLeadScore(
  supabase: SupabaseClient,
  crmLeadId: string,
): Promise<number | null> {
  const lead = await getLeadById(supabase, crmLeadId);
  if (!lead) return null;

  const [stages, openStageEntry, downloads] = await Promise.all([
    listPipelineStages(supabase),
    getOpenStageEntry(supabase, crmLeadId),
    lead.email ? listMaterialDownloadsByEmail(supabase, lead.email) : Promise.resolve([]),
  ]);

  const qualifiedStage = stages.find((s) => s.key === "qualificado");
  const daysInCurrentStage = openStageEntry
    ? Math.floor(
        (Date.now() - new Date(openStageEntry.enteredAt).getTime()) / (24 * 60 * 60 * 1000),
      )
    : 0;

  const score = computeLeadScore({
    hasCompany: !!lead.company?.trim(),
    hasPhone: !!lead.phone?.trim(),
    hasMaterialDownload: downloads.length > 0,
    isQualifiedOrBeyond: qualifiedStage ? lead.stage.position >= qualifiedStage.position : false,
    daysInCurrentStage,
    hasInteraction: !!lead.lastInteractionAt,
  });

  await setLeadScore(supabase, crmLeadId, score);
  return score;
}
