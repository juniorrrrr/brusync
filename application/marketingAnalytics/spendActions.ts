"use server";

import { revalidatePath } from "next/cache";
import { requireCrmProfile } from "@/application/crm/authGuard";
import {
  deleteCampaignSpend,
  listCampaignSpend,
  upsertCampaignSpend,
} from "@/repositories/marketing/campaignSpendRepository";
import { upsertCampaignSpendSchema } from "@/schemas/marketing/spend.schema";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { CampaignSpendEntry } from "@/types/marketing";

export interface SpendActionState {
  status: "idle" | "success" | "error";
  message?: string;
}

function firstIssueMessage(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message ?? "Dados inválidos.";
}

export async function fetchCampaignSpendAction(): Promise<CampaignSpendEntry[]> {
  await requireCrmProfile();
  const supabase = await getSupabaseAuthClient();
  return listCampaignSpend(supabase);
}

export async function upsertCampaignSpendAction(
  _prevState: SpendActionState,
  formData: FormData,
): Promise<SpendActionState> {
  const profile = await requireCrmProfile();

  const parsed = upsertCampaignSpendSchema.safeParse({
    utmSource: formData.get("utmSource"),
    utmCampaign: formData.get("utmCampaign"),
    periodMonth: formData.get("periodMonth"),
    amount: formData.get("amount"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { status: "error", message: firstIssueMessage(parsed.error) };
  }

  const supabase = await getSupabaseAuthClient();
  await upsertCampaignSpend(supabase, {
    utmSource: parsed.data.utmSource,
    utmCampaign: parsed.data.utmCampaign,
    periodMonth: parsed.data.periodMonth,
    amount: parsed.data.amount,
    notes: parsed.data.notes || null,
    createdBy: profile.id,
  });

  revalidatePath("/marketing/campanhas");
  revalidatePath("/marketing/executivo");
  revalidatePath("/marketing/origens");

  return { status: "success", message: "Investimento salvo." };
}

export async function deleteCampaignSpendAction(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireCrmProfile();
  const supabase = await getSupabaseAuthClient();
  await deleteCampaignSpend(supabase, id);

  revalidatePath("/marketing/campanhas");
  revalidatePath("/marketing/executivo");
  revalidatePath("/marketing/origens");

  return { ok: true };
}
