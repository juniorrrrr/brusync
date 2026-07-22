import "server-only";

import { META_POSSIBLE_FIELDS } from "@/domain/metaConversionsApi/payload";
import { getDemoMetaHealth } from "@/lib/demo/mockMetaEvents";
import { getDeliveryStatusCounts } from "@/repositories/conversions/conversionDeliveriesRepository";
import { listMetaAttempts } from "@/repositories/conversions/conversionDeliveryAttemptsRepository";
import { getIntegrationByProvider } from "@/repositories/integrations/integrationsRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { MetaHealthData } from "@/types/metaConversionsApi";

function fieldCoverageFromPayload(payload: Record<string, unknown> | null): number | null {
  const data = (
    payload as {
      data?: { user_data?: Record<string, unknown>; custom_data?: Record<string, unknown> }[];
    }
  )?.data?.[0];
  if (!data) return null;
  const present = new Set([
    ...Object.keys(data.user_data ?? {}),
    ...Object.keys(data.custom_data ?? {}),
  ]);
  return (present.size / META_POSSIBLE_FIELDS.length) * 100;
}

export async function getMetaHealthData(): Promise<MetaHealthData> {
  if (await isDemoModeActive()) return getDemoMetaHealth();

  const supabase = await getSupabaseAuthClient();
  const [integration, counts, { attempts }] = await Promise.all([
    getIntegrationByProvider(supabase, "meta_ads"),
    getDeliveryStatusCounts(supabase, "meta_ads"),
    listMetaAttempts(supabase, { limit: 50 }),
  ]);

  const successAttempts = attempts.filter((a) => a.status === "sucesso");
  const errorAttempts = attempts.filter((a) => a.status === "erro");
  const total = attempts.length;

  const coverageValues = successAttempts
    .map((a) => fieldCoverageFromPayload(a.requestPayload))
    .filter((v): v is number => v !== null);

  return {
    integration,
    pendingCount: counts.pendente,
    sentCount: counts.enviado,
    errorCount: counts.falhou,
    successRate: total > 0 ? (successAttempts.length / total) * 100 : null,
    fieldCoveragePercent:
      coverageValues.length > 0
        ? coverageValues.reduce((sum, v) => sum + v, 0) / coverageValues.length
        : null,
    lastSentAt: successAttempts[0]?.createdAt ?? null,
    recentFailures: errorAttempts.slice(0, 8).map((a) => ({
      id: a.id,
      leadName: a.leadName,
      message: a.message,
      createdAt: a.createdAt,
    })),
  };
}
