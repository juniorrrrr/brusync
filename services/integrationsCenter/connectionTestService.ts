import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { CONNECTION_NOT_IMPLEMENTED_MESSAGE } from "@/domain/integrationsCenter/logEvents";
import { createIntegrationLog } from "@/repositories/integrations/integrationLogsRepository";
import {
  getEncryptedAccessToken,
  getIntegrationByProvider,
} from "@/repositories/integrations/integrationsRepository";
import { testMetaConnection } from "@/services/conversionsHub/dispatchMetaDelivery";
import { getIntegrationProvider } from "@/services/integrationsCenter/integrationProviderRegistry";
import { decryptToken } from "@/services/metaConversionsApi/tokenCrypto";

export interface ConnectionTestResult {
  ok: boolean;
  message: string;
}

/** Central "Testar conexão" dispatcher — every provider's card/drawer quick
 * test button goes through here. Meta Ads (Pixel/Conversions API, Fase 9)
 * keeps its own inline branch since it's a distinct integration from every
 * `IntegrationProvider` (it tests a Pixel ID + Access Token pair, not an
 * OAuth-connected account) and was never touched by the Fase 34 provider
 * layer. Every other provider — including `meta_ads_manager` — is
 * implemented or stubbed behind `getIntegrationProvider()`
 * (services/integrationsCenter/integrationProviderRegistry.ts), so this
 * function never grows another `if (provider === ...)` branch again: a
 * future Google Ads/GA4/etc. provider just registers itself there. */
export async function testIntegrationConnection(
  supabase: SupabaseClient,
  provider: string,
): Promise<ConnectionTestResult> {
  const integration = await getIntegrationByProvider(supabase, provider);
  if (!integration) return { ok: false, message: "Integração não encontrada." };

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

  const dispatched = getIntegrationProvider(provider);
  if (dispatched.isImplemented()) return dispatched.testConnection();

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
