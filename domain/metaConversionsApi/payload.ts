import "server-only";

import { CONVERSION_TYPE_TO_META_EVENT } from "@/domain/metaConversionsApi/eventNames";
import { hashCity, hashEmail, hashName, hashPhone } from "@/domain/metaConversionsApi/hashing";
import type { ConversionEvent } from "@/types/conversions";

export interface MetaPayloadContact {
  email: string | null;
  phone: string | null;
  name: string | null;
  city: string | null;
}

export interface MetaPayloadInput {
  event: ConversionEvent;
  contact: MetaPayloadContact;
  eventSourceUrl: string | null;
  testEventCode?: string | null;
}

export interface MetaEventData {
  event_name: string;
  event_time: number;
  event_source_url?: string;
  action_source: string;
  event_id: string;
  user_data: Record<string, string>;
  custom_data?: Record<string, unknown>;
}

export interface MetaEventPayload {
  data: MetaEventData[];
  test_event_code?: string;
}

/** Every user_data / custom_data field Brusync could in principle send for
 * a conversion event — used both to build the real payload and to compute
 * "campos enviados / campos ausentes" for the data-quality panel. Client IP
 * and User Agent are always in the "possible" list but never actually sent:
 * CRM-driven events (a rep moving a Pipeline card, not a browser pixel
 * fire) have no request to read them from — an honest, documented gap
 * rather than a fabricated value. */
export const META_POSSIBLE_FIELDS = [
  "external_id",
  "em",
  "ph",
  "fn",
  "ct",
  "fbc",
  "client_ip_address",
  "client_user_agent",
  "event_source_url",
  "value",
  "currency",
] as const;

export function buildMetaEventPayload(input: MetaPayloadInput): {
  payload: MetaEventPayload;
  fieldsSent: string[];
  fieldsMissing: string[];
} {
  const { event, contact, eventSourceUrl, testEventCode } = input;

  const userData: Record<string, string> = {};
  const fieldsSent: string[] = [];

  const externalId = event.crmLeadId ?? event.clientId;
  if (externalId) {
    userData.external_id = externalId;
    fieldsSent.push("external_id");
  }
  if (contact.email) {
    userData.em = hashEmail(contact.email);
    fieldsSent.push("em");
  }
  if (contact.phone) {
    userData.ph = hashPhone(contact.phone);
    fieldsSent.push("ph");
  }
  if (contact.name) {
    userData.fn = hashName(contact.name);
    fieldsSent.push("fn");
  }
  if (contact.city) {
    userData.ct = hashCity(contact.city);
    fieldsSent.push("ct");
  }
  if (event.fbclid) {
    // Meta's documented fbc format: fb.{subdomain_index}.{creation_time_ms}.{fbclid}.
    // subdomain_index=1 (the common case for a root/www domain) and the
    // conversion event's own timestamp are used as a best-effort stand-in
    // for the original click time, which Brusync doesn't store separately
    // — see the Fase 9 report's "Limitações".
    const clickTimeMs = new Date(event.occurredAt).getTime();
    userData.fbc = `fb.1.${clickTimeMs}.${event.fbclid}`;
    fieldsSent.push("fbc");
  }

  const customData: Record<string, unknown> = {};
  if (event.value !== null) {
    customData.value = event.value;
    customData.currency = event.currency;
    fieldsSent.push("value", "currency");
  }

  if (eventSourceUrl) fieldsSent.push("event_source_url");

  const fieldsMissing = META_POSSIBLE_FIELDS.filter((field) => !fieldsSent.includes(field));

  const eventData: MetaEventData = {
    event_name: CONVERSION_TYPE_TO_META_EVENT[event.conversionType],
    event_time: Math.floor(new Date(event.occurredAt).getTime() / 1000),
    action_source: "system_generated",
    event_id: event.id,
    user_data: userData,
    ...(Object.keys(customData).length > 0 ? { custom_data: customData } : {}),
    ...(eventSourceUrl ? { event_source_url: eventSourceUrl } : {}),
  };

  return {
    payload: {
      data: [eventData],
      ...(testEventCode ? { test_event_code: testEventCode } : {}),
    },
    fieldsSent,
    fieldsMissing,
  };
}
