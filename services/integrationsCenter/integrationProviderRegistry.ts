import "server-only";

import type { IntegrationProvider } from "@/domain/integrations/provider";
import { createMetaAdsIntegrationProvider } from "@/services/integrationsCenter/providers/metaAdsIntegrationProvider";
import { createNotImplementedProvider } from "@/services/integrationsCenter/providers/notImplementedProvider";

/** One factory per real implementation — this is the only file a future
 * phase touches to light up Google Ads/GA4/Search Console/TikTok Ads/
 * LinkedIn Ads/Microsoft Ads/etc: write `services/integrationsCenter/
 * providers/googleAdsIntegrationProvider.ts` the same way Meta Ads' was
 * written, then add one line here. Everything that consumes
 * `getIntegrationProvider()` (Central de Integrações card/Drawer,
 * connectionTestService, Central de Operações) needs zero changes. */
const REAL_PROVIDER_FACTORIES: Record<string, () => IntegrationProvider> = {
  meta_ads_manager: createMetaAdsIntegrationProvider,
};

/** Central de Integrações' card/Drawer/testConnectionService should never
 * `if (provider === "...")` again after this phase — this is the one place
 * that still knows which providers are real. */
export function getIntegrationProvider(providerKey: string): IntegrationProvider {
  const factory = REAL_PROVIDER_FACTORIES[providerKey];
  if (factory) return factory();
  return createNotImplementedProvider(providerKey);
}
