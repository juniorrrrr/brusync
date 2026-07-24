"use server";

import { requireCrmProfile } from "@/application/crm/authGuard";
import { getDemoKnowledgeTags } from "@/lib/demo/mockKnowledge";
import { listTags } from "@/repositories/knowledge/tagsRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { KnowledgeTag } from "@/types/knowledge";

export async function fetchKnowledgeTags(): Promise<KnowledgeTag[]> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return getDemoKnowledgeTags();

  const supabase = await getSupabaseAuthClient();
  return listTags(supabase);
}
