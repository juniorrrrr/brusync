"use server";

import { requireCrmProfile } from "@/application/crm/authGuard";
import { getLeadMarketingProfile } from "@/application/marketingAnalytics/leadMarketingProfile";
import { getDemoLeadMarketingProfile } from "@/lib/demo/mockMarketing";
import { isDemoModeActive } from "@/services/demo/demoMode";
import type { LeadMarketingProfile } from "@/types/marketing";

export async function fetchLeadMarketingProfileAction(
  crmLeadId: string,
): Promise<LeadMarketingProfile | null> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return getDemoLeadMarketingProfile(crmLeadId);
  return getLeadMarketingProfile(crmLeadId);
}
