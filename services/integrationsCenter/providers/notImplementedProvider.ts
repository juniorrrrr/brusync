import "server-only";

import type { IntegrationProvider } from "@/domain/integrations/provider";
import { CONNECTION_NOT_IMPLEMENTED_MESSAGE } from "@/domain/integrationsCenter/logEvents";

/** Every provider in the catalog (domain/integrations/providers.ts) that
 * doesn't have a real implementation yet — Google Ads, GA4, Search Console,
 * TikTok Ads, LinkedIn Ads, Microsoft Ads, and so on — gets this same
 * honest stub instead of a special case per screen. Implementing one of
 * them for real is exactly "add a `createXProvider()` like
 * metaAdsIntegrationProvider.ts and register it" — no other file changes. */
export function createNotImplementedProvider(providerKey: string): IntegrationProvider {
  return {
    key: providerKey,
    isImplemented: () => false,
    getManageUrl: () => null,
    getConnectUrl: () => null,
    async needsEntitySelection() {
      return false;
    },
    async getStatus() {
      return {
        status: "em_desenvolvimento",
        healthScore: null,
        lastSyncAt: null,
        nextSyncAt: null,
        tokenExpiresAt: null,
        queuedJobs: 0,
        averageDurationMs: null,
        error: null,
      };
    },
    async testConnection() {
      return { ok: false, message: CONNECTION_NOT_IMPLEMENTED_MESSAGE };
    },
    async syncNow() {
      return { ok: false, message: CONNECTION_NOT_IMPLEMENTED_MESSAGE };
    },
    async disconnect() {},
    async getRecentLogs() {
      return [];
    },
  };
}
