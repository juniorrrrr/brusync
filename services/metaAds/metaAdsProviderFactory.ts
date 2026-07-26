import "server-only";

import type { MetaAdsProvider } from "@/domain/metaAds/provider";
import { MetaMarketingProvider } from "@/services/metaAds/metaMarketingProvider";

/** Fábrica única do provider de Meta Ads — hoje sempre devolve o
 * MetaMarketingProvider (única implementação real desta fase). Um futuro
 * provider de sandbox/mock (testes de integração sem bater na Graph API
 * real) implementa `MetaAdsProvider` (domain/metaAds/provider.ts) e este é
 * o ÚNICO arquivo que muda para ativá-lo — mesmo padrão de
 * services/whatsapp/whatsappProviderFactory.ts (Fase 28). */
let instance: MetaAdsProvider | null = null;

export function getMetaAdsProvider(
  _providerKey: "meta_marketing_api" = "meta_marketing_api",
): MetaAdsProvider {
  if (!instance) instance = new MetaMarketingProvider();
  return instance;
}
