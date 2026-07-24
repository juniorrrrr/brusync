"use server";

import { requireCrmProfile } from "@/application/crm/authGuard";
import { searchDemoKnowledge } from "@/lib/demo/mockKnowledge";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { searchKnowledge } from "@/services/knowledge/knowledgeSearchService";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { KnowledgeSearchResult } from "@/types/knowledge";

export async function searchKnowledgeAction(term: string): Promise<KnowledgeSearchResult[]> {
  await requireCrmProfile();
  if (!term.trim()) return [];
  if (await isDemoModeActive()) return searchDemoKnowledge(term);

  const supabase = await getSupabaseAuthClient();
  return searchKnowledge(supabase, term);
}
