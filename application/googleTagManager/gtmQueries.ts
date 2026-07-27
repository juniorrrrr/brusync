import "server-only";

import { requireCrmProfile } from "@/application/crm/authGuard";
import { getDemoGtmDashboardData } from "@/lib/demo/mockGtm";
import { countGtmEntitiesByType } from "@/repositories/googleTagManager/entitiesRepository";
import { listGtmVersions } from "@/repositories/googleTagManager/versionsRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getGtmContainer } from "@/services/googleTagManager/gtmAccountService";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { GtmDashboardData } from "@/types/gtm";

/** Único ponto de leitura consolidada do GTM. Ao contrário de Google Ads/
 * GA4/Search Console, não há métrica de desempenho aqui — GTM é uma
 * ferramenta de gestão de tags, então o "dashboard" é contagem de
 * entidades e status da última versão publicada. */
export async function fetchGtmDashboardData(): Promise<GtmDashboardData> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return getDemoGtmDashboardData();

  const container = await getGtmContainer();
  if (!container) {
    return {
      container: null,
      workspaceCount: 0,
      tagCount: 0,
      triggerCount: 0,
      variableCount: 0,
      entitiesByStatus: { active: 0, paused: 0 },
      latestVersion: null,
      lastSyncAt: null,
    };
  }

  const supabase = await getSupabaseAuthClient();
  const [counts, versions] = await Promise.all([
    countGtmEntitiesByType(supabase, container.id),
    listGtmVersions(supabase, container.id, 1),
  ]);

  const latest = versions[0] ?? null;

  return {
    container,
    workspaceCount: counts.workspace,
    tagCount: counts.tag,
    triggerCount: counts.trigger,
    variableCount: counts.variable,
    // A Tag Manager API v2 não expõe "status ativo/pausado" por tag na
    // listagem — sem uma chamada get() por tag (fora do escopo consolidado
    // desta fase), não há como distinguir sem inventar o dado.
    entitiesByStatus: { active: counts.tag + counts.trigger + counts.variable, paused: 0 },
    latestVersion: latest ? { name: latest.name, publishedAt: latest.publishedAt } : null,
    lastSyncAt: container.lastSyncAt,
  };
}
