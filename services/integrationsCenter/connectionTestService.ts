import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { CONNECTION_NOT_IMPLEMENTED_MESSAGE } from "@/domain/integrationsCenter/logEvents";
import { createIntegrationLog } from "@/repositories/integrations/integrationLogsRepository";
import {
  getEncryptedAccessToken,
  getIntegrationByProvider,
} from "@/repositories/integrations/integrationsRepository";
import { getActiveMetaAccount } from "@/repositories/metaAds/accountsRepository";
import { getCurrentTokenSecret } from "@/repositories/metaAds/tokensRepository";
import { testMetaConnection } from "@/services/conversionsHub/dispatchMetaDelivery";
import { getMetaAdsProvider } from "@/services/metaAds/metaAdsProviderFactory";
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

  // Meta Ads (Pixel/Conversions API, Fase 9) logs its own "teste_executado"
  // row inside testMetaConnection — every other provider is logged here
  // since there's no real test to run.
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

  // Meta Ads Manager (Marketing API, Fase 29) — testa o Access Token OAuth
  // vigente da conta conectada (domain/metaAds/provider.ts::validateToken),
  // nunca o mesmo Pixel/Access Token da integração acima.
  if (provider === "meta_ads_manager") {
    const account = await getActiveMetaAccount(supabase);
    if (!account) {
      return {
        ok: false,
        message: "Nenhuma conta conectada — conecte em Meta Ads → Configurações.",
      };
    }
    const tokenSecret = await getCurrentTokenSecret(supabase, account.id);
    if (!tokenSecret) {
      return { ok: false, message: "Nenhum Access Token salvo para esta conta." };
    }
    const accessToken = decryptToken(
      tokenSecret.access_token_ciphertext,
      tokenSecret.access_token_iv,
    );
    const validation = await getMetaAdsProvider().validateToken({ accessToken });

    await createIntegrationLog(supabase, {
      integrationId: integration.id,
      event: "teste_executado",
      status: validation.ok ? "success" : "error",
      message: validation.ok ? "Token válido." : (validation.error ?? "Falha ao validar token."),
      origin: "crm",
      destination: provider,
    });

    return {
      ok: validation.ok,
      message: validation.ok
        ? "Conexão validada com sucesso."
        : (validation.error ?? "Falha ao validar."),
    };
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
