import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { computeHealthScore } from "@/domain/integrations/health";
import {
  type CreateIntegrationLogPayload,
  createIntegrationLog,
} from "@/repositories/integrations/integrationLogsRepository";
import {
  getIntegrationByProvider,
  updateIntegration,
} from "@/repositories/integrations/integrationsRepository";

export interface ReflectSyncOutcomeParams {
  provider: string;
  outcome: "success" | "error";
  message: string;
  durationMs: number | null;
  /** Recent job outcomes (most-recent-first or any order — only the ratio
   * matters) used to compute the 0–100 health score shown on the card. */
  recentOutcomes: ("success" | "error")[];
  /** Only a failure that already exhausted its retry budget should flip the
   * card to "erro" — a transient failure still eligible for backoff retry
   * shouldn't make the badge flicker. */
  markErrored: boolean;
}

/** Generalizes services/metaAds/metaAdsSyncService.ts::
 * reflectJobOutcomeOnIntegration (Fase 34) into infrastructure any
 * provider's sync engine can call — mirrors the result of one sync run onto
 * the generic public.integrations row + public.integration_logs, which is
 * the only thing the Central de Integrações card/Drawer, Central de
 * Operações, and every other module ever reads. Never throws: a failure to
 * write the mirror must not take down the sync job itself. */
export async function reflectSyncOutcome(
  supabase: SupabaseClient,
  params: ReflectSyncOutcomeParams,
): Promise<void> {
  try {
    const integration = await getIntegrationByProvider(supabase, params.provider);
    if (!integration) return;

    const healthScore = computeHealthScore(params.recentOutcomes);
    const shouldMarkErrored = params.outcome === "error" && params.markErrored;

    await updateIntegration(supabase, params.provider, {
      status:
        params.outcome === "success"
          ? "conectado"
          : shouldMarkErrored
            ? "erro"
            : integration.status,
      lastSync: params.outcome === "success" ? new Date().toISOString() : integration.lastSync,
      healthScore,
      error: shouldMarkErrored
        ? params.message
        : params.outcome === "success"
          ? null
          : integration.error,
    });

    const logPayload: CreateIntegrationLogPayload = {
      integrationId: integration.id,
      event: params.outcome === "success" ? "sincronizacao_concluida" : "sincronizacao_falhou",
      status: params.outcome,
      message: params.message,
      origin: params.provider,
      destination: "crm",
      durationMs: params.durationMs,
    };
    await createIntegrationLog(supabase, logPayload);
  } catch {
    // Best-effort — nunca deve derrubar o job real por causa do espelho.
  }
}
