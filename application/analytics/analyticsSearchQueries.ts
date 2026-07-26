"use server";

import { requireCrmProfile } from "@/application/crm/authGuard";
import { searchAnalytics } from "@/services/analytics/analyticsSearchService";
import type { AnalyticsSearchResult } from "@/types/analytics";

export async function searchAnalyticsAction(term: string): Promise<AnalyticsSearchResult[]> {
  await requireCrmProfile();
  return searchAnalytics(term);
}
