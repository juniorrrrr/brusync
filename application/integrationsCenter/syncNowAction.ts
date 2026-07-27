"use server";

import { revalidatePath } from "next/cache";
import { requireCrmProfile } from "@/application/crm/authGuard";
import { getIntegrationProvider } from "@/services/integrationsCenter/integrationProviderRegistry";

/** "Sincronizar agora" on the Central de Integrações card — generic across
 * every provider (services/integrationsCenter/integrationProviderRegistry.ts
 * decides whether there's a real sync to run). Unlike testConnectionAction/
 * configureIntegrationAction, this does NOT block in Modo Demonstração:
 * each provider's own `syncNow()` simulates a coherent result instead
 * (never a real API call), per Fase 34's explicit demo requirement. */
export async function syncIntegrationNowAction(
  provider: string,
): Promise<{ ok: boolean; message: string }> {
  const profile = await requireCrmProfile();
  const result = await getIntegrationProvider(provider).syncNow(profile.id);
  revalidatePath("/integracoes");
  revalidatePath("/operacoes");
  return result;
}
