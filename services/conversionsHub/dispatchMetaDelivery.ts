import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { buildMetaEventPayload } from "@/domain/metaConversionsApi/payload";
import {
  getDeliveryById,
  updateDeliveryStatus,
} from "@/repositories/conversions/conversionDeliveriesRepository";
import { createAttempt } from "@/repositories/conversions/conversionDeliveryAttemptsRepository";
import { getConversionEventById } from "@/repositories/conversions/conversionEventsRepository";
import { getLeadById } from "@/repositories/crm/leadsRepository";
import { getSourceLeadAttribution } from "@/repositories/crm/marketingRepository";
import { createIntegrationLog } from "@/repositories/integrations/integrationLogsRepository";
import {
  getEncryptedAccessToken,
  getIntegrationByProvider,
  updateIntegration,
} from "@/repositories/integrations/integrationsRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { fetchMetaPixelInfo, sendMetaEvent } from "@/services/metaConversionsApi/client";
import { decryptToken } from "@/services/metaConversionsApi/tokenCrypto";

const MAX_ATTEMPTS = 5;

interface MetaConfig {
  pixelId?: string;
  testEventCode?: string;
  metaEventsEnabled?: Record<string, boolean>;
}

async function recordAttempt(
  supabase: SupabaseClient,
  deliveryId: string,
  args: {
    ok: boolean;
    message: string;
    durationMs: number;
    requestPayload?: Record<string, unknown> | null;
    responseBody?: Record<string, unknown> | null;
    httpStatus?: number | null;
    attempts: number;
  },
): Promise<void> {
  await createAttempt(supabase, {
    conversionDeliveryId: deliveryId,
    status: args.ok ? "sucesso" : "erro",
    message: args.message,
    durationMs: args.durationMs,
    requestPayload: args.requestPayload ?? null,
    responseBody: args.responseBody ?? null,
    httpStatus: args.httpStatus ?? null,
  });

  await updateDeliveryStatus(supabase, deliveryId, {
    status: args.ok ? "enviado" : "falhou",
    attempts: args.attempts,
    lastError: args.ok ? null : args.message,
    sentAt: args.ok ? new Date().toISOString() : undefined,
  });
}

/** The real dispatcher — the only place in Brusync that actually sends a
 * conversion to the Meta Conversions API. Called synchronously right after
 * a delivery is queued (services/conversionsHub/prepareConversion.ts) and
 * from the manual "Reenviar" action in the Lead Workspace's Meta tab —
 * never directly from a CRM action. Always safe to call: every failure path
 * records an attempt and leaves the delivery in a resumable state instead
 * of throwing. */
export async function dispatchMetaDelivery(
  supabase: SupabaseClient,
  deliveryId: string,
  options: { force?: boolean } = {},
): Promise<void> {
  // First line, no exceptions: Demo Mode must never reach graph.facebook.com.
  if (await isDemoModeActive()) return;

  const startedAt = Date.now();

  try {
    const delivery = await getDeliveryById(supabase, deliveryId);
    if (delivery?.destination !== "meta_ads") return;
    if (delivery.status === "enviado" && !options.force) return;
    if (delivery.attempts >= MAX_ATTEMPTS && !options.force) return;

    const integration = await getIntegrationByProvider(supabase, "meta_ads");
    if (!integration?.enabled) return;

    const config = integration.config as MetaConfig;
    const pixelId = config.pixelId;
    const encryptedToken = await getEncryptedAccessToken(supabase, "meta_ads");

    if (!pixelId || !encryptedToken) {
      await recordAttempt(supabase, deliveryId, {
        ok: false,
        message: "Meta não configurado — falta Pixel ID ou Access Token.",
        durationMs: Date.now() - startedAt,
        attempts: delivery.attempts + 1,
      });
      return;
    }

    const event = await getConversionEventById(supabase, delivery.conversionEventId);
    if (!event) {
      await recordAttempt(supabase, deliveryId, {
        ok: false,
        message: "Evento de conversão não encontrado (pode ter sido removido).",
        durationMs: Date.now() - startedAt,
        attempts: delivery.attempts + 1,
      });
      return;
    }

    // Each company chooses which of the 7 event types it wants to send —
    // an explicit "false" skips this event without counting it as an error;
    // the delivery is left "pendente" until re-enabled.
    if (config.metaEventsEnabled?.[event.conversionType] === false) return;

    await updateDeliveryStatus(supabase, deliveryId, { status: "enviando" });

    const lead = event.crmLeadId ? await getLeadById(supabase, event.crmLeadId) : null;
    const attribution = lead?.sourceLeadId
      ? await getSourceLeadAttribution(supabase, lead.sourceLeadId)
      : null;

    const { payload, fieldsSent, fieldsMissing } = buildMetaEventPayload({
      event,
      contact: {
        email: lead?.email ?? null,
        phone: lead?.phone ?? null,
        name: lead?.name ?? null,
        city: lead?.city ?? null,
      },
      eventSourceUrl: attribution?.landingPage ?? null,
      testEventCode: config.testEventCode ?? null,
    });

    const accessToken = decryptToken(encryptedToken.ciphertext, encryptedToken.iv);
    const result = await sendMetaEvent(pixelId, accessToken, payload);
    const durationMs = Date.now() - startedAt;
    const nextAttempts = delivery.attempts + 1;

    const metaError =
      result.body && typeof result.body === "object" && "error" in result.body
        ? ((result.body as { error?: { message?: string } }).error?.message ?? null)
        : null;

    await recordAttempt(supabase, deliveryId, {
      ok: result.ok,
      message: result.ok
        ? `Enviado (${fieldsSent.length} campos, ${fieldsMissing.length} ausentes).`
        : (metaError ?? `Falha HTTP ${result.httpStatus}.`),
      durationMs,
      requestPayload: payload as unknown as Record<string, unknown>,
      responseBody:
        result.body && typeof result.body === "object"
          ? (result.body as Record<string, unknown>)
          : { raw: result.body },
      httpStatus: result.httpStatus,
      attempts: nextAttempts,
    });

    await updateIntegration(supabase, "meta_ads", {
      lastSync: new Date().toISOString(),
      status: result.ok ? "conectado" : "erro",
      error: result.ok ? null : (metaError ?? `Falha HTTP ${result.httpStatus}`),
      healthScore: result.ok ? 100 : Math.max(0, (integration.healthScore ?? 50) - 20),
    });

    await createIntegrationLog(supabase, {
      integrationId: integration.id,
      event: event.conversionType,
      status: result.ok ? "success" : "error",
      message: result.ok
        ? "Evento enviado à Meta Conversions API."
        : (metaError ?? "Falha ao enviar evento à Meta."),
      payload: { conversionEventId: event.id, deliveryId },
      origin: "crm",
      destination: "meta_ads",
      durationMs,
    });
  } catch (err) {
    console.error("dispatchMetaDelivery: falha inesperada", err);
    try {
      const delivery = await getDeliveryById(supabase, deliveryId);
      await recordAttempt(supabase, deliveryId, {
        ok: false,
        message: err instanceof Error ? err.message : "Falha inesperada ao enviar evento.",
        durationMs: Date.now() - startedAt,
        attempts: (delivery?.attempts ?? 0) + 1,
      });
    } catch (innerErr) {
      console.error("dispatchMetaDelivery: falha ao registrar erro", innerErr);
    }
  }
}

/** "Testar conexão" — validates the Pixel ID + Access Token pair without
 * sending any event, then reflects the result onto the integration row.
 * Called both from MetaConfigForm's own test button and from the Central de
 * Integrações' generic quick-test action (services/integrationsCenter/
 * connectionTestService.ts) — logging lives here so both callers get a
 * "teste_executado" row in the integration's history exactly once. */
export async function testMetaConnection(
  supabase: SupabaseClient,
  pixelId: string,
  accessToken: string,
): Promise<{ ok: boolean; message: string }> {
  const result = await fetchMetaPixelInfo(pixelId, accessToken);
  const pixelName =
    result.body && typeof result.body === "object" && "name" in result.body
      ? String((result.body as { name?: string }).name ?? "")
      : null;
  const metaError =
    result.body && typeof result.body === "object" && "error" in result.body
      ? ((result.body as { error?: { message?: string } }).error?.message ?? null)
      : null;

  await updateIntegration(supabase, "meta_ads", {
    status: result.ok ? "conectado" : "erro",
    connectedAt: result.ok ? new Date().toISOString() : undefined,
    error: result.ok ? null : (metaError ?? `Falha HTTP ${result.httpStatus}`),
    healthScore: result.ok ? 100 : 0,
  });

  const message = result.ok
    ? `Conectado ao Pixel${pixelName ? ` "${pixelName}"` : ""} com sucesso.`
    : (metaError ?? `Falha ao conectar (HTTP ${result.httpStatus}).`);

  const integration = await getIntegrationByProvider(supabase, "meta_ads");
  await createIntegrationLog(supabase, {
    integrationId: integration?.id ?? null,
    event: result.ok || !metaError ? "teste_executado" : "erro_autenticacao",
    status: result.ok ? "success" : "error",
    message,
    origin: "crm",
    destination: "meta_ads",
  });

  return { ok: result.ok, message };
}
