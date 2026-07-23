import "server-only";

import { getDemoAgendaHealth } from "@/lib/demo/mockAgenda";
import { getAgendaHealthStats } from "@/repositories/agenda/agendaEventsRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { AgendaHealth } from "@/types/agenda";

export async function getAgendaHealthData(): Promise<AgendaHealth> {
  if (await isDemoModeActive()) return getDemoAgendaHealth();

  const supabase = await getSupabaseAuthClient();
  return getAgendaHealthStats(supabase);
}
