import "server-only";

import type { GtmDataProvider } from "@/domain/googleTagManager/provider";
import { GoogleTagManagerRestClient } from "@/services/googleTagManager/gtmRestClient";

let instance: GtmDataProvider | null = null;

export function getGtmProvider(): GtmDataProvider {
  if (!instance) instance = new GoogleTagManagerRestClient();
  return instance;
}
