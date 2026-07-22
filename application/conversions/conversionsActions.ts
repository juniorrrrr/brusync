"use server";

import {
  getConversionEventDetail,
  getConversionEventsForLead,
} from "@/application/conversions/conversionsQueries";
import { requireCrmProfile } from "@/application/crm/authGuard";
import type { ConversionEvent, ConversionEventDetail } from "@/types/conversions";

export async function fetchConversionEventDetail(
  id: string,
): Promise<ConversionEventDetail | null> {
  await requireCrmProfile();
  return getConversionEventDetail(id);
}

export async function fetchConversionEventsForLead(crmLeadId: string): Promise<ConversionEvent[]> {
  await requireCrmProfile();
  return getConversionEventsForLead(crmLeadId);
}
