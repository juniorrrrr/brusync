"use server";

import { revalidatePath } from "next/cache";
import { requireCrmProfile } from "@/application/crm/authGuard";
import { createIntegrationLog } from "@/repositories/integrations/integrationLogsRepository";
import {
  getIntegrationByProvider,
  updateIntegration,
} from "@/repositories/integrations/integrationsRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";

const DEMO_WRITE_BLOCKED_MESSAGE =
  "Ação indisponível em Modo Demonstração — nenhuma escrita é enviada ao banco.";

/** Standalone "Ativar/Desativar" quick action — separate from the
 * config/credentials "Salvar" form so the card and the drawer can both
 * toggle it in one click, per Fase 16's card spec. Logs "reconexao" instead
 * of the plain "ativada" when re-enabling an integration that was
 * previously in an error state. */
export async function toggleIntegrationEnabledAction(
  provider: string,
  enabled: boolean,
): Promise<{ ok: boolean; error?: string }> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };

  const supabase = await getSupabaseAuthClient();
  const integration = await getIntegrationByProvider(supabase, provider);
  if (!integration) return { ok: false, error: "Integração não encontrada." };

  await updateIntegration(supabase, provider, { enabled });

  const isReconnecting = enabled && integration.status === "erro";
  await createIntegrationLog(supabase, {
    integrationId: integration.id,
    event: isReconnecting ? "reconexao" : enabled ? "ativada" : "desativada",
    status: "success",
    message: isReconnecting
      ? "Integração reativada após erro."
      : enabled
        ? "Integração ativada."
        : "Integração desativada.",
    origin: "crm",
    destination: provider,
  });

  revalidatePath("/integracoes");
  return { ok: true };
}
