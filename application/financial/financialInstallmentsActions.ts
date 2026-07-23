"use server";

import { revalidatePath } from "next/cache";
import { requireCrmProfile } from "@/application/crm/authGuard";
import { isDemoModeActive } from "@/services/demo/demoMode";
import {
  markInstallmentPaid,
  reopenInstallment,
} from "@/services/financial/financialStatusService";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";

const DEMO_WRITE_BLOCKED_MESSAGE =
  "Ação indisponível em Modo Demonstração — nenhuma escrita é enviada ao banco.";

export async function markInstallmentPaidAction(
  installmentId: string,
  transactionId: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };

  const supabase = await getSupabaseAuthClient();
  await markInstallmentPaid(supabase, installmentId, transactionId);
  revalidatePath("/financeiro");
  return { ok: true };
}

export async function reopenInstallmentAction(
  installmentId: string,
  transactionId: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };

  const supabase = await getSupabaseAuthClient();
  await reopenInstallment(supabase, installmentId, transactionId);
  revalidatePath("/financeiro");
  return { ok: true };
}
