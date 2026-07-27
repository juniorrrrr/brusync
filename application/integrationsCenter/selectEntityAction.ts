"use server";

import { revalidatePath } from "next/cache";
import { requireCrmProfile } from "@/application/crm/authGuard";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getIntegrationProvider } from "@/services/integrationsCenter/integrationProviderRegistry";

const DEMO_WRITE_BLOCKED_MESSAGE =
  "Ação indisponível em Modo Demonstração — nenhuma escrita é enviada ao banco.";

/** Segunda metade do fluxo "Escolha da conta/propriedade/container/site"
 * (Fase 35) — chamado pelo GoogleEntityPicker depois que o OAuth já voltou
 * com candidatas em `listSelectableEntities`. */
export async function selectIntegrationEntityAction(
  provider: string,
  entityId: string,
): Promise<{ ok: boolean; message: string }> {
  await requireCrmProfile();
  if (await isDemoModeActive()) {
    return { ok: false, message: DEMO_WRITE_BLOCKED_MESSAGE };
  }

  const dispatched = getIntegrationProvider(provider);
  if (!dispatched.selectEntity) {
    return { ok: false, message: "Esta integração não suporta seleção de conta." };
  }

  try {
    await dispatched.selectEntity(entityId);
    revalidatePath("/integracoes");
    revalidatePath("/operacoes");
    return { ok: true, message: "Conta selecionada — sincronização iniciada." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Falha ao selecionar conta.",
    };
  }
}
