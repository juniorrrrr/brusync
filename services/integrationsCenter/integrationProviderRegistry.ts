import "server-only";

import type { IntegrationProvider } from "@/domain/integrations/provider";
import { createGa4IntegrationProvider } from "@/services/integrationsCenter/providers/ga4IntegrationProvider";
import { createGoogleAdsIntegrationProvider } from "@/services/integrationsCenter/providers/googleAdsIntegrationProvider";
import { createGoogleTagManagerIntegrationProvider } from "@/services/integrationsCenter/providers/googleTagManagerIntegrationProvider";
import { createMetaAdsIntegrationProvider } from "@/services/integrationsCenter/providers/metaAdsIntegrationProvider";
import { createNotImplementedProvider } from "@/services/integrationsCenter/providers/notImplementedProvider";
import { createSearchConsoleIntegrationProvider } from "@/services/integrationsCenter/providers/searchConsoleIntegrationProvider";

/** One factory per real implementation — this is the only file a future
 * phase touches to light up TikTok Ads/LinkedIn Ads/Microsoft Ads/etc:
 * write `services/integrationsCenter/providers/<name>IntegrationProvider.ts`
 * the same way Meta Ads' and the 4 Google providers were written, then add
 * one line here. Everything that consumes `getIntegrationProvider()`
 * (Central de Integrações card/Drawer, connectionTestService, Central de
 * Operações) needs zero changes. */
const REAL_PROVIDER_FACTORIES: Record<string, () => IntegrationProvider> = {
  meta_ads_manager: createMetaAdsIntegrationProvider,
  google_ads: createGoogleAdsIntegrationProvider,
  ga4: createGa4IntegrationProvider,
  gtm: createGoogleTagManagerIntegrationProvider,
  search_console: createSearchConsoleIntegrationProvider,
};

/** Central de Integrações' card/Drawer/testConnectionService should never
 * `if (provider === "...")` again after this phase — this is the one place
 * that still knows which providers are real. */
export function getIntegrationProvider(providerKey: string): IntegrationProvider {
  const factory = REAL_PROVIDER_FACTORIES[providerKey];
  if (factory) return factory();
  return createNotImplementedProvider(providerKey);
}
