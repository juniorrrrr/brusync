"use server";

import { revalidatePath } from "next/cache";
import { requireCrmProfile } from "@/application/crm/authGuard";
import * as favoritesRepo from "@/repositories/operations/favoritesRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { OperationsFavoriteEntityType } from "@/types/operations";

const DEMO_WRITE_BLOCKED_MESSAGE =
  "Ação indisponível em Modo Demonstração — nenhuma escrita é enviada ao banco.";

export async function addOperationsFavoriteAction(params: {
  entityType: OperationsFavoriteEntityType;
  entityId: string;
  label: string;
  href: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };

  const supabase = await getSupabaseAuthClient();
  await favoritesRepo.addFavorite(supabase, { userId: profile.id, ...params });

  revalidatePath("/operacoes");
  return { ok: true };
}

export async function removeOperationsFavoriteAction(
  entityType: OperationsFavoriteEntityType,
  entityId: string,
): Promise<{ ok: boolean; error?: string }> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };

  const supabase = await getSupabaseAuthClient();
  await favoritesRepo.removeFavorite(supabase, profile.id, entityType, entityId);

  revalidatePath("/operacoes");
  return { ok: true };
}
