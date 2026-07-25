"use server";

import { requireCrmProfile } from "@/application/crm/authGuard";
import { searchEverything } from "@/services/operations/operationsSearchService";
import type { OperationsSearchResult } from "@/types/operations";

export async function searchOperationsAction(term: string): Promise<OperationsSearchResult[]> {
  await requireCrmProfile();
  return searchEverything(term);
}
