import type { GtmContainer, GtmDashboardData } from "@/types/gtm";

const now = new Date();
function daysAgoIso(days: number): string {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

export const DEMO_GTM_CONTAINER: GtmContainer = {
  id: "00000000-gt00-4000-8000-000000000001",
  containerId: "45678901",
  accountIdExternal: "6001234567",
  name: "Brusync — Site institucional",
  publicId: "GTM-ABCD123",
  usageContext: ["web"],
  isSynced: true,
  status: "conectado",
  lastSyncAt: daysAgoIso(0),
  error: null,
  clientId: null,
  responsibleId: null,
  createdAt: daysAgoIso(60),
  updatedAt: daysAgoIso(0),
};

const DEMO_ENTITY_COUNTS = { workspaces: 1, tags: 8, triggers: 5, variables: 4 };

export function getDemoGtmContainer(): GtmContainer {
  return DEMO_GTM_CONTAINER;
}

export function getDemoGtmDashboardData(): GtmDashboardData {
  return {
    container: DEMO_GTM_CONTAINER,
    workspaceCount: DEMO_ENTITY_COUNTS.workspaces,
    tagCount: DEMO_ENTITY_COUNTS.tags,
    triggerCount: DEMO_ENTITY_COUNTS.triggers,
    variableCount: DEMO_ENTITY_COUNTS.variables,
    entitiesByStatus: { active: 7, paused: 1 },
    latestVersion: { name: "v12 — Atualização de conversões", publishedAt: daysAgoIso(4) },
    lastSyncAt: DEMO_GTM_CONTAINER.lastSyncAt,
  };
}
