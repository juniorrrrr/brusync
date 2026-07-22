import "server-only";

import { DEMO_INTEGRATIONS } from "@/lib/demo/mockIntegrations";
import {
  type ListIntegrationsOptions,
  listIntegrations,
} from "@/repositories/integrations/integrationsRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { Integration } from "@/types/integrations";

export interface IntegrationsPageData {
  integrations: Integration[];
}

function applyDemoFilters(
  integrations: Integration[],
  options: ListIntegrationsOptions,
): Integration[] {
  let result = integrations;
  if (options.category) result = result.filter((i) => i.category === options.category);
  if (options.status) result = result.filter((i) => i.status === options.status);
  if (options.search) {
    const term = options.search.toLowerCase();
    result = result.filter(
      (i) => i.name.toLowerCase().includes(term) || i.provider.toLowerCase().includes(term),
    );
  }
  return result;
}

export async function getIntegrationsPageData(
  options: ListIntegrationsOptions = {},
): Promise<IntegrationsPageData> {
  if (await isDemoModeActive()) {
    return { integrations: applyDemoFilters(DEMO_INTEGRATIONS, options) };
  }

  const supabase = await getSupabaseAuthClient();
  const integrations = await listIntegrations(supabase, options);
  return { integrations };
}
