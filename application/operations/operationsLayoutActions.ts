"use server";

import { revalidatePath } from "next/cache";
import { requireCrmProfile } from "@/application/crm/authGuard";
import * as layoutsRepo from "@/repositories/operations/layoutsRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { OperationsWidgetConfig } from "@/types/operations";

const DEMO_WRITE_BLOCKED_MESSAGE =
  "Ação indisponível em Modo Demonstração — nenhuma escrita é enviada ao banco.";

export async function saveOperationsLayoutAction(
  layout: OperationsWidgetConfig[],
): Promise<{ ok: boolean; error?: string }> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };

  const supabase = await getSupabaseAuthClient();
  await layoutsRepo.saveLayoutForUser(supabase, profile.id, layout);

  revalidatePath("/operacoes");
  return { ok: true };
}
