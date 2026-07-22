import type { BadgeTone } from "@/types/crm";

export type IntegrationCategory =
  | "publicidade"
  | "analytics"
  | "comunicacao"
  | "automacao"
  | "developer";

export type IntegrationStatus = "conectado" | "desconectado" | "erro" | "em_desenvolvimento";

export const INTEGRATION_CATEGORY_LABEL: Record<IntegrationCategory, string> = {
  publicidade: "Publicidade",
  analytics: "Analytics",
  comunicacao: "Comunicação",
  automacao: "Automação",
  developer: "Developer",
};

export const INTEGRATION_STATUS_LABEL: Record<IntegrationStatus, string> = {
  conectado: "Conectado",
  desconectado: "Desconectado",
  erro: "Erro",
  em_desenvolvimento: "Em desenvolvimento",
};

export const INTEGRATION_STATUS_BADGE: Record<IntegrationStatus, BadgeTone> = {
  conectado: "ok",
  desconectado: "neutral",
  erro: "danger",
  em_desenvolvimento: "info",
};

export interface Integration {
  id: string;
  provider: string;
  category: IntegrationCategory;
  name: string;
  description: string | null;
  status: IntegrationStatus;
  enabled: boolean;
  connectedAt: string | null;
  lastSync: string | null;
  nextSync: string | null;
  config: Record<string, unknown>;
  error: string | null;
  healthScore: number | null;
  createdAt: string;
  updatedAt: string;
  /** Whether an Access Token is currently saved — never the token itself
   * (see services/metaConversionsApi/tokenCrypto.ts). */
  hasAccessToken: boolean;
}

export type IntegrationLogStatus = "success" | "error" | "pending";

export interface IntegrationLog {
  id: string;
  integrationId: string | null;
  integrationName: string | null;
  integrationProvider: string | null;
  event: string;
  status: IntegrationLogStatus;
  message: string | null;
  payload: Record<string, unknown> | null;
  origin: string | null;
  destination: string | null;
  durationMs: number | null;
  createdAt: string;
}

export type IntegrationEventStatus = "pending" | "processed" | "failed";

export interface IntegrationEvent {
  id: string;
  eventType: string;
  entityType: string | null;
  entityId: string | null;
  payload: Record<string, unknown>;
  status: IntegrationEventStatus;
  processedAt: string | null;
  actorId: string | null;
  createdAt: string;
}

export interface IntegrationHealthSummary {
  activeIntegrations: number;
  offlineIntegrations: number;
  errorIntegrations: number;
  lastSyncAt: string | null;
  eventsSent: number;
  eventsProcessed: number;
  averageDurationMs: number | null;
  successRate: number | null;
}
