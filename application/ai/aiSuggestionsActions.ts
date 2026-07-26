"use server";

import { requireCrmProfile } from "@/application/crm/authGuard";
import { setSuggestionFavorite } from "@/repositories/ai/suggestionsRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";

export async function toggleAiSuggestionFavoriteAction(
  id: string,
  favorite: boolean,
): Promise<{ ok: boolean }> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false };

  const supabase = await getSupabaseAuthClient();
  await setSuggestionFavorite(supabase, id, favorite);
  return { ok: true };
}
