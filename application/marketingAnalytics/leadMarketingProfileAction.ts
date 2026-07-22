"use server";

import { requireCrmProfile } from "@/application/crm/authGuard";
import { getLeadMarketingProfile } from "@/application/marketingAnalytics/leadMarketingProfile";
import type { LeadMarketingProfile } from "@/types/marketing";

export async function fetchLeadMarketingProfileAction(
  crmLeadId: string,
): Promise<LeadMarketingProfile | null> {
  await requireCrmProfile();
  return getLeadMarketingProfile(crmLeadId);
}
