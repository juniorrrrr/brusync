import "server-only";

import type { SearchConsoleDataProvider } from "@/domain/searchConsole/provider";
import { SearchConsoleRestClient } from "@/services/searchConsole/searchConsoleRestClient";

let instance: SearchConsoleDataProvider | null = null;

export function getSearchConsoleProvider(): SearchConsoleDataProvider {
  if (!instance) instance = new SearchConsoleRestClient();
  return instance;
}
