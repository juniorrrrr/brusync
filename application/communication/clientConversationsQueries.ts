"use server";

import { requireCrmProfile } from "@/application/crm/authGuard";
import { getDemoConversationsForClient } from "@/lib/demo/mockCommunication";
import { listConversationsForClient } from "@/repositories/communication/conversationsRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";

/** Powers the Client Drawer's "Comunicação" section. */
export async function fetchConversationsForClient(clientId: string) {
  await requireCrmProfile();
  if (await isDemoModeActive()) return getDemoConversationsForClient(clientId);

  const supabase = await getSupabaseAuthClient();
  return listConversationsForClient(supabase, clientId);
}
