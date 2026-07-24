import { INTEGRATION_PROVIDERS } from "@/domain/integrations/providers";
import type {
  Integration,
  IntegrationHealthSummary,
  IntegrationLog,
  IntegrationLogStatus,
  IntegrationStatus,
} from "@/types/integrations";

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

/** Providers shown as already "conectado" in Demo Mode — everything else
 * stays "em_desenvolvimento", matching the real catalog's default state, so
 * the demo dashboard looks alive without pretending every integration is
 * live (a future reader shouldn't come away thinking this app already ships
 * real Meta/Google connections). */
const DEMO_CONNECTED: Record<string, { healthScore: number; lastSyncDaysAgo: number }> = {
  meta_ads: { healthScore: 96, lastSyncDaysAgo: 0 },
  google_ads: { healthScore: 91, lastSyncDaysAgo: 0 },
  ga4: { healthScore: 88, lastSyncDaysAgo: 1 },
  whatsapp: { healthScore: 99, lastSyncDaysAgo: 0 },
  slack: { healthScore: 100, lastSyncDaysAgo: 0 },
  n8n: { healthScore: 74, lastSyncDaysAgo: 2 },
};

const DEMO_ERROR: Record<string, string> = {
  linkedin_ads: "Token de acesso expirado — reconecte a conta do LinkedIn Ads.",
};

function statusFor(provider: string): IntegrationStatus {
  if (DEMO_ERROR[provider]) return "erro";
  if (DEMO_CONNECTED[provider]) return "conectado";
  return "em_desenvolvimento";
}

let idCounter = 0;
function demoId(): string {
  idCounter += 1;
  return `00000000-d000-4000-8000-${String(idCounter).padStart(12, "0")}`;
}

export const DEMO_INTEGRATIONS: Integration[] = INTEGRATION_PROVIDERS.map((meta) => {
  const connected = DEMO_CONNECTED[meta.provider];
  const status = statusFor(meta.provider);
  return {
    id: demoId(),
    provider: meta.provider,
    category: meta.category,
    name: meta.name,
    description: meta.description,
    status,
    enabled: status === "conectado",
    connectedAt: connected ? daysAgoIso(30) : null,
    lastSync: connected ? daysAgoIso(connected.lastSyncDaysAgo) : null,
    nextSync: connected ? new Date(Date.now() + 3_600_000).toISOString() : null,
    config: {},
    error: DEMO_ERROR[meta.provider] ?? null,
    healthScore: connected?.healthScore ?? (DEMO_ERROR[meta.provider] ? 20 : null),
    createdAt: daysAgoIso(60),
    updatedAt: daysAgoIso(connected?.lastSyncDaysAgo ?? 10),
    hasAccessToken: meta.provider === "meta_ads",
  };
});

interface DemoLogSeed {
  provider: string;
  event: string;
  status: IntegrationLogStatus;
  message: string;
  daysAgo: number;
  durationMs: number;
  destination: string;
}

const DEMO_LOG_SEEDS: DemoLogSeed[] = [
  {
    provider: "meta_ads",
    event: "LeadCreated",
    status: "success",
    message: "Evento de lead enviado para Meta Conversions API.",
    daysAgo: 0,
    durationMs: 420,
    destination: "meta_ads",
  },
  {
    provider: "google_ads",
    event: "LeadWon",
    status: "success",
    message: "Conversão offline enviada ao Google Ads.",
    daysAgo: 0,
    durationMs: 610,
    destination: "google_ads",
  },
  {
    provider: "ga4",
    event: "LeadQualified",
    status: "success",
    message: "Evento enviado ao GA4 via Measurement Protocol.",
    daysAgo: 1,
    durationMs: 280,
    destination: "ga4",
  },
  {
    provider: "whatsapp",
    event: "TaskCreated",
    status: "success",
    message: "Notificação de nova tarefa enviada via WhatsApp.",
    daysAgo: 1,
    durationMs: 190,
    destination: "whatsapp",
  },
  {
    provider: "slack",
    event: "ClientCreated",
    status: "success",
    message: "Alerta de novo cliente publicado no canal #vendas.",
    daysAgo: 2,
    durationMs: 150,
    destination: "slack",
  },
  {
    provider: "linkedin_ads",
    event: "LeadCreated",
    status: "error",
    message: "Falha de autenticação: token de acesso expirado.",
    daysAgo: 2,
    durationMs: 90,
    destination: "linkedin_ads",
  },
  {
    provider: "n8n",
    event: "LeadLost",
    status: "success",
    message: "Workflow de reengajamento disparado no N8N.",
    daysAgo: 3,
    durationMs: 340,
    destination: "n8n",
  },
  {
    provider: "meta_ads",
    event: "RevenueRegistered",
    status: "pending",
    message: "Aguardando confirmação da Meta Conversions API.",
    daysAgo: 0,
    durationMs: 0,
    destination: "meta_ads",
  },
];

export function getDemoIntegrationLogs(): IntegrationLog[] {
  return DEMO_LOG_SEEDS.map((seed, index) => {
    const integration = DEMO_INTEGRATIONS.find((i) => i.provider === seed.provider) ?? null;
    return {
      id: `00000000-d000-4001-8000-${String(index + 1).padStart(12, "0")}`,
      integrationId: integration?.id ?? null,
      integrationName: integration?.name ?? seed.provider,
      integrationProvider: seed.provider,
      event: seed.event,
      status: seed.status,
      message: seed.message,
      payload: { demo: true, event: seed.event },
      origin: "crm",
      destination: seed.destination,
      durationMs: seed.durationMs,
      createdAt: daysAgoIso(seed.daysAgo),
    };
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getDemoIntegrationHealth(): IntegrationHealthSummary {
  const active = DEMO_INTEGRATIONS.filter((i) => i.status === "conectado").length;
  const errored = DEMO_INTEGRATIONS.filter((i) => i.status === "erro").length;
  const offline = DEMO_INTEGRATIONS.length - active - errored;
  const logs = getDemoIntegrationLogs();
  const successLogs = logs.filter((log) => log.status === "success");

  return {
    activeIntegrations: active,
    offlineIntegrations: offline,
    errorIntegrations: errored,
    lastSyncAt: logs[0]?.createdAt ?? null,
    eventsSent: logs.length,
    eventsProcessed: successLogs.length,
    queuedEvents: logs.filter((log) => log.status === "pending").length,
    averageDurationMs:
      successLogs.length > 0
        ? Math.round(
            successLogs.reduce((sum, log) => sum + (log.durationMs ?? 0), 0) / successLogs.length,
          )
        : null,
    successRate: logs.length > 0 ? (successLogs.length / logs.length) * 100 : null,
  };
}
