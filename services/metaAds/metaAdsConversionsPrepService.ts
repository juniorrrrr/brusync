import "server-only";

import { listConversionEvents } from "@/repositories/metaAds/conversionEventsRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { MetaConversionEvent } from "@/types/metaAds";

/** "Preparar integração com Meta Conversions API" (escopo desta fase): os
 * eventos que a própria Meta já atribuiu às campanhas (Purchase, Lead,
 * CompleteRegistration, AddToCart, ViewContent, PageView — sincronizados em
 * meta_conversion_events pelo Insights da Marketing API) usam os MESMOS
 * nomes de evento do Meta Conversions API (domain/metaConversionsApi/
 * eventNames.ts, Fase 9). O disparo em si (server-side, via Conversions
 * API/Pixel) continua 100% em services/conversionsHub/dispatchMetaDelivery.ts
 * — este módulo não duplica aquela fila nem cria um segundo dispatcher;
 * apenas garante que os nomes de evento nunca divergem entre os dois
 * módulos, para o dia em que a Fase 8/9 quiser correlacionar um envio com a
 * campanha que originou o clique (fbclid → meta_campaigns). */
export async function getConversionEventsForAdAccount(
  adAccountId: string,
  since: string,
  until: string,
): Promise<MetaConversionEvent[]> {
  if (await isDemoModeActive()) return [];
  const supabase = await getSupabaseAuthClient();
  return listConversionEvents(supabase, adAccountId, since, until);
}
