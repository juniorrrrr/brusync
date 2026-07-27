"use server";

import { revalidatePath } from "next/cache";
import { requireCrmProfile } from "@/application/crm/authGuard";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getIntegrationProvider } from "@/services/integrationsCenter/integrationProviderRegistry";

const DEMO_WRITE_BLOCKED_MESSAGE =
  "Ação indisponível em Modo Demonstração — nenhuma escrita é enviada ao banco.";

/** "Desconectar" on the Central de Integrações card — one click, no need to
 * open the provider's own settings screen. Blocked in Modo Demonstração
 * like every other write in this module (unlike syncNowAction, there's no
 * "simulated disconnect" to show — it would just make the demo account
 * vanish for the rest of the session). */
export async function disconnectIntegrationAction(
  provider: string,
): Promise<{ ok: boolean; message: string }> {
  await requireCrmProfile();
  if (await isDemoModeActive()) {
    return { ok: false, message: DEMO_WRITE_BLOCKED_MESSAGE };
  }

  await getIntegrationProvider(provider).disconnect();
  revalidatePath("/integracoes");
  revalidatePath("/operacoes");
  return { ok: true, message: "Integração desconectada." };
}
