import "server-only";

import { buildPlaybookDashboardData } from "@/domain/playbooks/dashboard";
import {
  getDemoPlaybookDashboardData,
  getDemoPlaybookDetail,
  getDemoPlaybookForStage,
  getDemoPlaybooksPageData,
  getDemoPlaybookTemplates,
} from "@/lib/demo/mockPlaybooks";
import { getLeadById } from "@/repositories/crm/leadsRepository";
import * as historyRepo from "@/repositories/playbooks/historyRepository";
import * as playbooksRepo from "@/repositories/playbooks/playbooksRepository";
import * as stepsRepo from "@/repositories/playbooks/stepsRepository";
import * as templatesRepo from "@/repositories/playbooks/templatesRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type {
  PlaybookDashboardData,
  PlaybookDetail,
  PlaybookListFilters,
  PlaybooksPageData,
  PlaybookTemplate,
} from "@/types/playbooks";

export async function getPlaybooksPageData(
  filters: PlaybookListFilters = {},
): Promise<PlaybooksPageData> {
  if (await isDemoModeActive()) return getDemoPlaybooksPageData(filters);
  const supabase = await getSupabaseAuthClient();
  return playbooksRepo.listPlaybooks(supabase, filters);
}

export async function getPlaybookDashboardData(): Promise<PlaybookDashboardData> {
  if (await isDemoModeActive()) return getDemoPlaybookDashboardData();
  const supabase = await getSupabaseAuthClient();
  const { playbooks } = await playbooksRepo.listPlaybooks(supabase);
  return buildPlaybookDashboardData(playbooks);
}

export async function getPlaybookTemplates(): Promise<PlaybookTemplate[]> {
  if (await isDemoModeActive()) return getDemoPlaybookTemplates();
  const supabase = await getSupabaseAuthClient();
  return templatesRepo.listPlaybookTemplates(supabase);
}

export async function getPlaybookDetail(id: string): Promise<PlaybookDetail | null> {
  if (await isDemoModeActive()) return getDemoPlaybookDetail(id);

  const supabase = await getSupabaseAuthClient();
  const summary = await playbooksRepo.getPlaybookById(supabase, id);
  if (!summary) return null;

  const [steps, history] = await Promise.all([
    stepsRepo.listStepsForPlaybook(supabase, id),
    historyRepo.listHistoryForPlaybook(supabase, id),
  ]);

  return { ...summary, steps, history };
}

export async function getPlaybookForLead(leadId: string): Promise<PlaybookDetail | null> {
  if (await isDemoModeActive()) return getDemoPlaybookForStage("diagnostico");

  const supabase = await getSupabaseAuthClient();
  const lead = await getLeadById(supabase, leadId);
  if (!lead) return null;

  const summary = await playbooksRepo.getPlaybookByStage(supabase, lead.stageId);
  if (!summary) return null;

  const [steps, history] = await Promise.all([
    stepsRepo.listStepsForPlaybook(supabase, summary.id),
    historyRepo.listHistoryForPlaybook(supabase, summary.id),
  ]);

  return { ...summary, steps, history };
}
