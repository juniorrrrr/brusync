"use server";

import { requireCrmProfile } from "@/application/crm/authGuard";
import { runIntelligenceEngine } from "@/services/intelligence/intelligenceEngineService";
import type {
  IntelligenceDashboardData,
  IntelligenceDateRange,
  IntelligencePeriodKey,
} from "@/types/intelligence";

export async function fetchIntelligenceDashboardData(
  period: IntelligencePeriodKey = "30d",
  custom?: IntelligenceDateRange,
): Promise<IntelligenceDashboardData> {
  await requireCrmProfile();
  return runIntelligenceEngine(period, custom);
}
