"use server";

import { revalidatePath } from "next/cache";
import { requireCrmProfile } from "@/application/crm/authGuard";
import * as insightsRepo from "@/repositories/intelligence/insightsRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";

const DEMO_WRITE_BLOCKED_MESSAGE =
  "Ação indisponível em Modo Demonstração — nenhuma escrita é enviada ao banco.";

export async function ignoreIntelligenceInsightAction(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };

  const supabase = await getSupabaseAuthClient();
  await insightsRepo.ignoreInsight(supabase, id);

  revalidatePath("/inteligencia");
  return { ok: true };
}
