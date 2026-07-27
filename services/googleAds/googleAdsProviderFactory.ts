import "server-only";

import type { GoogleAdsDataProvider } from "@/domain/googleAds/provider";
import { GoogleAdsRestClient } from "@/services/googleAds/googleAdsRestClient";

/** Fábrica única do provider de Google Ads — mesmo padrão de
 * services/metaAds/metaAdsProviderFactory.ts. Um futuro provider de
 * sandbox/mock implementa GoogleAdsDataProvider e este é o único arquivo
 * que muda para ativá-lo. */
let instance: GoogleAdsDataProvider | null = null;

export function getGoogleAdsProvider(): GoogleAdsDataProvider {
  if (!instance) instance = new GoogleAdsRestClient();
  return instance;
}
