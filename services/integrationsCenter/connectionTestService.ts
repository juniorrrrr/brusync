import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { CONNECTION_NOT_IMPLEMENTED_MESSAGE } from "@/domain/integrationsCenter/logEvents";
import { createIntegrationLog } from "@/repositories/integrations/integrationLogsRepository";
import {
  getEncryptedAccessToken,
  getIntegrationByProvider,
} from "@/repositories/integrations/integrationsRepository";
import { testMetaConnection } from "@/services/conversionsHub/dispatchMetaDelivery";
import { decryptToken } from "@/services/metaConversionsApi/tokenCrypto";

export interface ConnectionTestResult {
  ok: boolean;
  message: string;
}

/** Central "Testar conexão" dispatcher — every provider's card/drawer quick
 * test button goes through here. Meta Ads is the only provider with a real
 * API to call (tests whatever Pixel ID/Access Token are already saved —
 * MetaConfigForm's own "Testar conexão" tests credentials before saving
 * them, this one tests what's live). Every other provider gets the same
 * honest message and never a simulated success, per Fase 16's explicit
 * instruction. Always appends a "teste_executado" row to the integration's
 * own history, regardless of outcome. */
export async function testIntegrationConnection(
  supabase: SupabaseClient,
  provider: string,
): Promise<ConnectionTestResult> {
  const integration = await getIntegrationByProvider(supabase, provider);
  if (!integration) return { ok: false, message: "Integração não encontrada." };

  // Meta Ads logs its own "teste_executado" row inside testMetaConnection —
  // every other provider is logged here since there's no real test to run.
  if (provider === "meta_ads") {
    const config = integration.config as { pixelId?: string };
    if (!config.pixelId) {
      return { ok: false, message: "Informe o Meta Pixel ID na configuração antes de testar." };
    }
    const saved = await getEncryptedAccessToken(supabase, provider);
    if (!saved) {
      return {
        ok: false,
        message: "Nenhum Access Token salvo — configure a integração antes de testar.",
      };
    }
    const accessToken = decryptToken(saved.ciphertext, saved.iv);
    return testMetaConnection(supabase, config.pixelId, accessToken);
  }

  const result: ConnectionTestResult = { ok: false, message: CONNECTION_NOT_IMPLEMENTED_MESSAGE };

  await createIntegrationLog(supabase, {
    integrationId: integration.id,
    event: "teste_executado",
    status: "pending",
    message: result.message,
    origin: "crm",
    destination: provider,
  });

  return result;
}
