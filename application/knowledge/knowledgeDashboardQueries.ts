"use server";

import { requireCrmProfile } from "@/application/crm/authGuard";
import { getDemoKnowledgeDashboardData } from "@/lib/demo/mockKnowledge";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getKnowledgeDashboardData } from "@/services/knowledge/knowledgeDashboardService";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { KnowledgeDashboardData } from "@/types/knowledge";

export async function fetchKnowledgeDashboardData(): Promise<KnowledgeDashboardData> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return getDemoKnowledgeDashboardData();

  const supabase = await getSupabaseAuthClient();
  return getKnowledgeDashboardData(supabase);
}
