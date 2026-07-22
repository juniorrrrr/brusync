import { CONVERSION_TYPE_TO_META_EVENT } from "@/domain/metaConversionsApi/eventNames";
import { getDemoConversionEvents, getDemoConversionsForLead } from "@/lib/demo/mockConversions";
import type {
  AttemptsPage,
  ListMetaAttemptsOptions,
} from "@/repositories/conversions/conversionDeliveryAttemptsRepository";
import type { ConversionDeliveryAttempt } from "@/types/conversions";
import type { LeadMetaEvent, MetaHealthData } from "@/types/metaConversionsApi";

const DEMO_ERROR_MESSAGES = [
  "Invalid parameter: user_data must contain at least one identifying field.",
  "Token de acesso expirado — reconecte a conta do Meta Ads.",
  "(#100) Object does not exist or you do not have permission to perform this action.",
];

/** Deterministic per-event outcome — the same demo lead always shows the
 * same story, mirroring how Fase 7/8's demo generators work. Roughly 1 in 7
 * events "fails", giving the health/logs screens a mix to look at instead
 * of a suspiciously perfect 100%. */
function outcomeFor(eventId: string): "sucesso" | "erro" {
  const lastChar = eventId.charCodeAt(eventId.length - 1);
  return lastChar % 7 === 0 ? "erro" : "sucesso";
}

function fakeFbtraceId(eventId: string): string {
  return `Aa${eventId.replace(/-/g, "").slice(0, 20)}`;
}

function buildDemoAttempt(
  eventId: string,
  conversionType: string,
  occurredAt: string,
): ConversionDeliveryAttempt {
  const status = outcomeFor(eventId);
  const metaEventName =
    CONVERSION_TYPE_TO_META_EVENT[conversionType as keyof typeof CONVERSION_TYPE_TO_META_EVENT];

  return {
    id: `${eventId}-meta-attempt`,
    conversionDeliveryId: `${eventId}-meta-delivery`,
    status,
    message:
      status === "sucesso"
        ? "Enviado (6 campos, 5 ausentes)."
        : DEMO_ERROR_MESSAGES[eventId.length % DEMO_ERROR_MESSAGES.length],
    durationMs: 220 + (eventId.length % 5) * 60,
    requestPayload: {
      data: [
        {
          event_name: metaEventName,
          event_time: Math.floor(new Date(occurredAt).getTime() / 1000),
          action_source: "system_generated",
          event_id: eventId,
          user_data: { external_id: eventId, em: "•••• (hash)", fn: "•••• (hash)" },
        },
      ],
    },
    responseBody:
      status === "sucesso"
        ? { events_received: 1, messages: [], fbtrace_id: fakeFbtraceId(eventId) }
        : {
            error: {
              message: DEMO_ERROR_MESSAGES[eventId.length % DEMO_ERROR_MESSAGES.length],
              type: "OAuthException",
            },
          },
    httpStatus: status === "sucesso" ? 200 : 400,
    createdAt: occurredAt,
  };
}

export function getDemoMetaHealth(): MetaHealthData {
  const events = getDemoConversionEvents();
  const attempts = events.map((e) => buildDemoAttempt(e.id, e.conversionType, e.occurredAt));
  const successAttempts = attempts.filter((a) => a.status === "sucesso");
  const errorAttempts = attempts.filter((a) => a.status === "erro");

  return {
    integration: null,
    pendingCount: 0,
    sentCount: successAttempts.length,
    errorCount: errorAttempts.length,
    successRate: attempts.length > 0 ? (successAttempts.length / attempts.length) * 100 : null,
    fieldCoveragePercent: 55,
    lastSentAt: successAttempts[0]?.createdAt ?? null,
    recentFailures: errorAttempts.slice(0, 8).map((a) => {
      const event = events.find((e) => `${e.id}-meta-attempt` === a.id);
      return {
        id: a.id,
        leadName: event?.leadName ?? null,
        message: a.message,
        createdAt: a.createdAt,
      };
    }),
  };
}

export function getDemoMetaLogs(options: ListMetaAttemptsOptions = {}): AttemptsPage {
  const events = getDemoConversionEvents();
  let attempts = events.map((e) => ({
    ...buildDemoAttempt(e.id, e.conversionType, e.occurredAt),
    conversionEventId: e.id,
    conversionType: e.conversionType,
    leadId: e.crmLeadId,
    leadName: e.leadName,
    destination: "meta_ads",
  }));

  if (options.status) attempts = attempts.filter((a) => a.status === options.status);
  if (options.leadId) attempts = attempts.filter((a) => a.leadId === options.leadId);
  if (options.conversionType)
    attempts = attempts.filter((a) => a.conversionType === options.conversionType);
  if (options.search) {
    const term = options.search.toLowerCase();
    attempts = attempts.filter((a) => a.leadName?.toLowerCase().includes(term));
  }

  const total = attempts.length;
  const limit = options.limit ?? 50;
  const offset = options.offset ?? 0;
  return { attempts: attempts.slice(offset, offset + limit), total };
}

export function getDemoMetaEventsForLead(crmLeadId: string): LeadMetaEvent[] {
  const events = getDemoConversionsForLead(crmLeadId);
  return events
    .map((event) => {
      const attempt = buildDemoAttempt(event.id, event.conversionType, event.occurredAt);
      return {
        deliveryId: `${event.id}-meta-delivery`,
        conversionType: event.conversionType,
        occurredAt: event.occurredAt,
        status: attempt.status === "sucesso" ? "enviado" : "falhou",
        attempts: 1,
        lastError: attempt.status === "erro" ? attempt.message : null,
        sentAt: attempt.status === "sucesso" ? attempt.createdAt : null,
        pixelId: "123456789012345",
        latestAttempt: attempt,
      };
    })
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}
