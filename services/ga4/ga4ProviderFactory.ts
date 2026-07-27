import "server-only";

import type { Ga4DataProvider } from "@/domain/ga4/provider";
import { GoogleAnalyticsRestProvider } from "@/services/ga4/ga4RestClient";

let instance: Ga4DataProvider | null = null;

export function getGa4Provider(): Ga4DataProvider {
  if (!instance) instance = new GoogleAnalyticsRestProvider();
  return instance;
}
