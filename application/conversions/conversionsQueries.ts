import "server-only";

import {
  getDemoConversionEventById,
  getDemoConversionEvents,
  getDemoConversionsForLead,
} from "@/lib/demo/mockConversions";
import { listAttemptsForDeliveries } from "@/repositories/conversions/conversionDeliveryAttemptsRepository";
import {
  getConversionEventById,
  type ListConversionEventsOptions,
  listConversionEvents,
  listConversionEventsForLead,
} from "@/repositories/conversions/conversionEventsRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { ConversionEvent, ConversionEventDetail } from "@/types/conversions";

export interface ConversionsPageData {
  events: ConversionEvent[];
  total: number;
}

function applyDemoFilters(
  events: ConversionEvent[],
  options: ListConversionEventsOptions,
): ConversionsPageData {
  let result = events;
  if (options.conversionType) {
    result = result.filter((event) => event.conversionType === options.conversionType);
  }
  if (options.destination) {
    result = result.filter((event) =>
      event.deliveries.some((delivery) => delivery.destination === options.destination),
    );
  }
  if (options.status) {
    result = result.filter((event) =>
      event.deliveries.some((delivery) => delivery.status === options.status),
    );
  }
  if (options.search) {
    const term = options.search.toLowerCase();
    result = result.filter((event) => event.leadName?.toLowerCase().includes(term));
  }

  const total = result.length;
  const limit = options.limit ?? 50;
  const offset = options.offset ?? 0;
  return { events: result.slice(offset, offset + limit), total };
}

export async function getConversionsPageData(
  options: ListConversionEventsOptions = {},
): Promise<ConversionsPageData> {
  if (await isDemoModeActive()) return applyDemoFilters(getDemoConversionEvents(), options);

  const supabase = await getSupabaseAuthClient();
  return listConversionEvents(supabase, options);
}

export async function getConversionEventDetail(id: string): Promise<ConversionEventDetail | null> {
  if (await isDemoModeActive()) {
    const event = getDemoConversionEventById(id);
    return event ? { ...event, attemptsByDelivery: {} } : null;
  }

  const supabase = await getSupabaseAuthClient();
  const event = await getConversionEventById(supabase, id);
  if (!event) return null;

  const attemptsByDelivery = await listAttemptsForDeliveries(
    supabase,
    event.deliveries.map((delivery) => delivery.id),
  );

  return { ...event, attemptsByDelivery };
}

export async function getConversionEventsForLead(crmLeadId: string): Promise<ConversionEvent[]> {
  if (await isDemoModeActive()) return getDemoConversionsForLead(crmLeadId);

  const supabase = await getSupabaseAuthClient();
  return listConversionEventsForLead(supabase, crmLeadId);
}
