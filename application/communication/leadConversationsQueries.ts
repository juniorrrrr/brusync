"use server";

import { requireCrmProfile } from "@/application/crm/authGuard";
import { getDemoConversationsForLead } from "@/lib/demo/mockCommunication";
import { listConversationsForLead } from "@/repositories/communication/conversationsRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";

/** Powers the Lead Workspace's "Comunicação" tab. */
export async function fetchConversationsForLead(crmLeadId: string) {
  await requireCrmProfile();
  if (await isDemoModeActive()) return getDemoConversationsForLead(crmLeadId);

  const supabase = await getSupabaseAuthClient();
  return listConversationsForLead(supabase, crmLeadId);
}
