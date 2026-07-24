"use server";

import { revalidatePath } from "next/cache";
import { requireCrmProfile } from "@/application/crm/authGuard";
import * as alertsRepo from "@/repositories/intelligence/alertsRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";

const DEMO_WRITE_BLOCKED_MESSAGE =
  "Ação indisponível em Modo Demonstração — nenhuma escrita é enviada ao banco.";

export async function acknowledgeIntelligenceAlertAction(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };

  const supabase = await getSupabaseAuthClient();
  await alertsRepo.acknowledgeAlert(supabase, id, profile.id);

  revalidatePath("/inteligencia");
  return { ok: true };
}

export async function resolveIntelligenceAlertAction(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };

  const supabase = await getSupabaseAuthClient();
  await alertsRepo.resolveAlert(supabase, id);

  revalidatePath("/inteligencia");
  return { ok: true };
}
