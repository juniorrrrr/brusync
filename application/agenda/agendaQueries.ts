import "server-only";

import { getDemoAgendaEvents, getDemoAgendaEventsForLead } from "@/lib/demo/mockAgenda";
import { DEMO_PIPELINE_STAGES } from "@/lib/demo/mockSeed";
import {
  type AgendaEventsPage,
  type ListAgendaEventsOptions,
  listAgendaEvents,
  listAgendaEventsForLead,
} from "@/repositories/agenda/agendaEventsRepository";
import { listPipelineStages } from "@/repositories/crm/pipelineStagesRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { AgendaEvent } from "@/types/agenda";
import type { PipelineStage } from "@/types/crm";

export async function getPipelineStageOptions(): Promise<PipelineStage[]> {
  if (await isDemoModeActive()) return DEMO_PIPELINE_STAGES;

  const supabase = await getSupabaseAuthClient();
  return listPipelineStages(supabase);
}

export async function getAgendaPageData(
  options: ListAgendaEventsOptions = {},
): Promise<AgendaEventsPage> {
  if (await isDemoModeActive()) return getDemoAgendaEvents(options);

  const supabase = await getSupabaseAuthClient();
  return listAgendaEvents(supabase, options);
}

export async function getAgendaEventsForLead(crmLeadId: string): Promise<AgendaEvent[]> {
  if (await isDemoModeActive()) return getDemoAgendaEventsForLead(crmLeadId);

  const supabase = await getSupabaseAuthClient();
  return listAgendaEventsForLead(supabase, crmLeadId);
}
