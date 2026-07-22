"use server";

import { requireCrmProfile } from "@/application/crm/authGuard";
import { CONVERSION_TYPES_FOR_META } from "@/domain/metaConversionsApi/eventNames";
import {
  getEncryptedAccessToken,
  getIntegrationByProvider,
  setEncryptedAccessToken,
  updateIntegration,
} from "@/repositories/integrations/integrationsRepository";
import { testMetaConnection } from "@/services/conversionsHub/dispatchMetaDelivery";
import { isDemoModeActive } from "@/services/demo/demoMode";
import {
  decryptToken,
  encryptToken,
  isTokenEncryptionConfigured,
} from "@/services/metaConversionsApi/tokenCrypto";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { ConversionType } from "@/types/conversions";
import type { MetaSettings } from "@/types/metaConversionsApi";

const DEMO_WRITE_BLOCKED_MESSAGE =
  "Ação indisponível em Modo Demonstração — nenhuma escrita é enviada ao banco.";

/** Only the "administrador" role can configure or change Meta credentials —
 * a stricter bar than the generic is_internal_staff() RLS check every other
 * table in the app uses, because this specific action can write a real,
 * live API secret. */
async function requireAdmin() {
  const profile = await requireCrmProfile();
  if (profile.role !== "administrador") {
    throw new Error("Apenas administradores podem configurar a integração com a Meta.");
  }
  return profile;
}

export async function fetchMetaSettings(): Promise<MetaSettings | null> {
  await requireCrmProfile();
  const supabase = await getSupabaseAuthClient();
  const integration = await getIntegrationByProvider(supabase, "meta_ads");
  if (!integration) return null;

  const config = integration.config as {
    pixelId?: string;
    testEventCode?: string;
    metaEventsEnabled?: Partial<Record<ConversionType, boolean>>;
  };

  const eventsEnabled = Object.fromEntries(
    CONVERSION_TYPES_FOR_META.map((type) => [type, config.metaEventsEnabled?.[type] ?? true]),
  ) as Record<ConversionType, boolean>;

  return {
    pixelId: config.pixelId ?? "",
    testEventCode: config.testEventCode ?? "",
    hasAccessToken: integration.hasAccessToken,
    enabled: integration.enabled,
    eventsEnabled,
    status: integration.status,
    error: integration.error,
    healthScore: integration.healthScore,
    lastSync: integration.lastSync,
    connectedAt: integration.connectedAt,
  };
}

export interface MetaSettingsActionState {
  status: "idle" | "success" | "error";
  message?: string;
}

export async function saveMetaSettingsAction(
  _prevState: MetaSettingsActionState,
  formData: FormData,
): Promise<MetaSettingsActionState> {
  await requireAdmin();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  const pixelId = String(formData.get("pixelId") ?? "").trim();
  const testEventCode = String(formData.get("testEventCode") ?? "").trim();
  const accessToken = String(formData.get("accessToken") ?? "").trim();
  const enabled = formData.get("enabled") === "on";

  if (!pixelId) return { status: "error", message: "Informe o Meta Pixel ID." };

  const supabase = await getSupabaseAuthClient();
  const integration = await getIntegrationByProvider(supabase, "meta_ads");
  if (!integration) return { status: "error", message: "Integração Meta Ads não encontrada." };

  const existingConfig = integration.config as {
    metaEventsEnabled?: Partial<Record<ConversionType, boolean>>;
  };
  const eventsEnabled: Partial<Record<ConversionType, boolean>> = {};
  for (const type of CONVERSION_TYPES_FOR_META) {
    eventsEnabled[type] = formData.get(`event_${type}`) === "on";
  }

  await updateIntegration(supabase, "meta_ads", {
    enabled,
    config: {
      ...existingConfig,
      pixelId,
      testEventCode: testEventCode || undefined,
      metaEventsEnabled: eventsEnabled,
    },
  });

  if (accessToken) {
    if (!isTokenEncryptionConfigured()) {
      return {
        status: "error",
        message:
          "META_TOKEN_ENCRYPTION_KEY não configurada no servidor — o Access Token não pôde ser salvo com segurança.",
      };
    }
    try {
      const encrypted = encryptToken(accessToken);
      await setEncryptedAccessToken(supabase, "meta_ads", encrypted);
    } catch (err) {
      return {
        status: "error",
        message: err instanceof Error ? err.message : "Falha ao criptografar o Access Token.",
      };
    }
  }

  return { status: "success", message: "Configuração salva." };
}

export async function removeMetaAccessTokenAction(): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };

  const supabase = await getSupabaseAuthClient();
  await setEncryptedAccessToken(supabase, "meta_ads", null);
  return { ok: true };
}

export async function testMetaConnectionAction(
  pixelId: string,
  accessToken: string,
): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  if (await isDemoModeActive()) {
    return {
      ok: true,
      message: "Modo Demonstração: conexão simulada com sucesso (nada foi enviado).",
    };
  }
  if (!pixelId) {
    return { ok: false, message: "Informe o Pixel ID antes de testar." };
  }

  const supabase = await getSupabaseAuthClient();

  let tokenToUse = accessToken;
  if (!tokenToUse) {
    const saved = await getEncryptedAccessToken(supabase, "meta_ads");
    if (!saved)
      return { ok: false, message: "Nenhum Access Token salvo — informe um para testar." };
    tokenToUse = decryptToken(saved.ciphertext, saved.iv);
  }

  return testMetaConnection(supabase, pixelId, tokenToUse);
}
