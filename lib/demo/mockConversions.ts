import {
  CONVERSION_DESTINATIONS,
  EVENT_TYPE_ORIGIN,
  EVENT_TYPE_TO_CONVERSION_TYPE,
} from "@/domain/conversions/types";
import type { EventType } from "@/domain/events/types";
import { JOURNEY_STAGE_EVENT_TYPE } from "@/domain/journey/stages";
import { buildCampaignKey } from "@/domain/marketing/campaignKey";
import { buildJourneyEvents, ownerName } from "@/lib/demo/mockJourney";
import { DEMO_LEADS, type DemoLeadSeed } from "@/lib/demo/mockSeed";
import type {
  ConversionDelivery,
  ConversionEvent,
  ConversionsHealthSummary,
} from "@/types/conversions";

function buildDeliveries(conversionEventId: string, createdAt: string): ConversionDelivery[] {
  return CONVERSION_DESTINATIONS.map((destination, index) => ({
    id: `${conversionEventId}-d${index}`,
    conversionEventId,
    destination,
    status: "pendente",
    attempts: 0,
    lastError: null,
    sentAt: null,
    createdAt,
    updatedAt: createdAt,
  }));
}

function buildConversionsForSeed(seed: DemoLeadSeed): ConversionEvent[] {
  const journeyEvents = buildJourneyEvents(seed);
  const events: ConversionEvent[] = [];

  for (const journeyEvent of journeyEvents) {
    const eventType: EventType | undefined = JOURNEY_STAGE_EVENT_TYPE[journeyEvent.stage];
    const conversionType = eventType ? EVENT_TYPE_TO_CONVERSION_TYPE[eventType] : undefined;
    if (!eventType || !conversionType) continue;

    const isWon = journeyEvent.stage === "venda_ganha";
    const id = `00000000-d003-4000-8000-${String(events.length + 1).padStart(6, "0")}${seed.id.slice(-6)}`;

    events.push({
      id,
      conversionType,
      origin: EVENT_TYPE_ORIGIN[eventType] ?? "CRM",
      crmLeadId: seed.id,
      leadName: seed.name,
      clientId: seed.becameClient ? seed.id : null,
      clientName: seed.becameClient ? seed.company : null,
      utmSource: seed.utm?.source ?? null,
      utmMedium: seed.utm?.medium ?? null,
      utmCampaign: seed.utm?.campaign ?? null,
      utmContent: seed.utm?.content ?? null,
      utmTerm: seed.utm?.term ?? null,
      campaignKey: buildCampaignKey({
        utmSource: seed.utm?.source ?? null,
        utmCampaign: seed.utm?.campaign ?? null,
      }),
      gclid: seed.utm?.gclid ?? null,
      fbclid: seed.utm?.fbclid ?? null,
      msclkid: null,
      ttclid: seed.utm?.ttclid ?? null,
      occurredAt: journeyEvent.occurredAt,
      actorId: null,
      actorName: ownerName(seed),
      value: isWon ? seed.potentialValue : null,
      currency: "BRL",
      ready: true,
      createdAt: journeyEvent.createdAt,
      deliveries: buildDeliveries(id, journeyEvent.createdAt),
    });
  }

  return events;
}

export function getDemoConversionsForLead(crmLeadId: string): ConversionEvent[] {
  const seed = DEMO_LEADS.find((lead) => lead.id === crmLeadId);
  if (!seed) return [];
  return buildConversionsForSeed(seed);
}

export function getDemoConversionEvents(): ConversionEvent[] {
  return DEMO_LEADS.flatMap(buildConversionsForSeed).sort((a, b) =>
    b.occurredAt.localeCompare(a.occurredAt),
  );
}

export function getDemoConversionEventById(id: string): ConversionEvent | null {
  return getDemoConversionEvents().find((event) => event.id === id) ?? null;
}

export function getDemoConversionsHealth(): ConversionsHealthSummary {
  const events = getDemoConversionEvents();
  const deliveries = events.flatMap((event) => event.deliveries);

  const byOrigin = new Map<string, number>();
  for (const event of events) {
    byOrigin.set(event.origin, (byOrigin.get(event.origin) ?? 0) + 1);
  }

  const byDestination = new Map<string, number>();
  for (const delivery of deliveries) {
    byDestination.set(delivery.destination, (byDestination.get(delivery.destination) ?? 0) + 1);
  }

  return {
    totalEvents: events.length,
    pendingDeliveries: deliveries.filter((d) => d.status === "pendente").length,
    sentDeliveries: deliveries.filter((d) => d.status === "enviado").length,
    failedDeliveries: deliveries.filter((d) => d.status === "falhou").length,
    byOrigin: [...byOrigin.entries()].map(([origin, count]) => ({ origin, count })),
    byDestination: [...byDestination.entries()].map(([destination, count]) => ({
      destination: destination as ConversionEvent["deliveries"][number]["destination"],
      count,
    })),
  };
}
