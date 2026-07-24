"use server";

import { revalidatePath } from "next/cache";
import { requireCrmProfile } from "@/application/crm/authGuard";
import * as rulesRepo from "@/repositories/intelligence/rulesRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { IntelligenceRule } from "@/types/intelligence";

const DEMO_WRITE_BLOCKED_MESSAGE =
  "Ação indisponível em Modo Demonstração — nenhuma escrita é enviada ao banco.";

export async function fetchIntelligenceRules(): Promise<IntelligenceRule[]> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return [];

  const supabase = await getSupabaseAuthClient();
  return rulesRepo.listRules(supabase);
}

export async function toggleIntelligenceRuleAction(
  key: string,
  enabled: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };
  if (profile.role !== "administrador" && profile.role !== "gestor") {
    return { ok: false, error: "Apenas administradores e gestores configuram regras." };
  }

  const supabase = await getSupabaseAuthClient();
  await rulesRepo.updateRuleEnabled(supabase, key, enabled);

  revalidatePath("/inteligencia");
  return { ok: true };
}
