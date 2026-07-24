"use server";

import { requireCrmProfile } from "@/application/crm/authGuard";
import { CONNECTION_NOT_IMPLEMENTED_MESSAGE } from "@/domain/integrationsCenter/logEvents";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { testIntegrationConnection } from "@/services/integrationsCenter/connectionTestService";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";

export async function testIntegrationConnectionAction(
  provider: string,
): Promise<{ ok: boolean; message: string }> {
  await requireCrmProfile();
  if (await isDemoModeActive()) {
    return { ok: false, message: CONNECTION_NOT_IMPLEMENTED_MESSAGE };
  }

  const supabase = await getSupabaseAuthClient();
  return testIntegrationConnection(supabase, provider);
}
