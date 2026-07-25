"use server";

import { requireCrmProfile } from "@/application/crm/authGuard";
import { buildOperationsDashboard } from "@/services/operations/operationsDashboardService";
import type { IntelligencePeriodKey } from "@/types/intelligence";
import type { OperationsDashboardData } from "@/types/operations";

export async function fetchOperationsDashboardData(
  period: IntelligencePeriodKey = "hoje",
): Promise<OperationsDashboardData> {
  const profile = await requireCrmProfile();
  return buildOperationsDashboard(profile.id, period);
}
