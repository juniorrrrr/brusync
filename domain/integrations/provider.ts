import type { IntegrationLog, IntegrationStatus } from "@/types/integrations";

/** Live status snapshot a provider reports about itself — this is what gets
 * written back onto its `integrations` row (repositories/integrations/
 * integrationsRepository.ts::updateIntegration) so every screen that already
 * reads that generic table (the Central de Integrações board, the Drawer,
 * Central de Operações' getIntegrationHealthData) reflects reality without
 * knowing which provider it's looking at. */
export interface IntegrationStatusSnapshot {
  status: IntegrationStatus;
  healthScore: number | null;
  lastSyncAt: string | null;
  nextSyncAt: string | null;
  /** null when the provider has no token-based auth or nothing saved yet. */
  tokenExpiresAt: string | null;
  /** Jobs currently queued/running in the provider's own sync engine —
   * "Fila" on the card. 0 for providers with no async queue. */
  queuedJobs: number;
  /** Mean duration of the last few successful sync runs, in ms — "Tempo
   * médio". null until there's at least one successful run to measure. */
  averageDurationMs: number | null;
  error: string | null;
}

export interface IntegrationTestResult {
  ok: boolean;
  message: string;
}

export interface IntegrationSyncResult {
  ok: boolean;
  message: string;
}

/** The contract every integration (Meta Ads, and — as they're implemented —
 * Google Ads, GA4, Search Console, TikTok Ads, LinkedIn Ads, Microsoft Ads,
 * ...) must satisfy to plug into the Central de Integrações. No module
 * outside `services/integrationsCenter` and each provider's own service
 * layer may call an external API directly — everyone else (CRM, Analytics,
 * Marketing Intelligence, IA, Central de Operações) only ever reads data
 * these providers already synced into their own tables. */
export interface IntegrationProvider {
  readonly key: string;
  /** false for every provider still only "prepared" (catalog entry, no real
   * API wiring yet) — every method below still answers honestly instead of
   * throwing when this is false. */
  isImplemented(): boolean;
  getStatus(): Promise<IntegrationStatusSnapshot>;
  testConnection(): Promise<IntegrationTestResult>;
  /** Triggers a sync now (enqueue + immediate processing when the provider
   * supports it) — mirrors the same "Sincronizar agora" UX already shipped
   * for Meta Ads' own settings screen, just reachable generically from the
   * Central de Integrações card too. `actorProfileId` is resolved by the
   * calling Server Action (session already required there), never inside
   * the provider itself — same layering as every other write in this app. */
  syncNow(actorProfileId: string | null): Promise<IntegrationSyncResult>;
  disconnect(): Promise<void>;
  getRecentLogs(limit?: number): Promise<IntegrationLog[]>;
  /** Where "Conectar"/"Reconectar"/"Ver configuração completa" should point
   * — null when the provider has no dedicated screen (falls back to the
   * generic notes-only Drawer form). */
  getManageUrl(): string | null;
}
