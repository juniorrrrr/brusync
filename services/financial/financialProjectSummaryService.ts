import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { computeProjectFinancialSummary } from "@/domain/financial/calculations";
import {
  listLedgerRowsForTransactionIds,
  listTransactionsForProject,
} from "@/repositories/financial/transactionsRepository";
import type { ProjectFinancialSummary } from "@/types/financial";

export async function getProjectFinancialSummary(
  supabase: SupabaseClient,
  projectId: string,
): Promise<ProjectFinancialSummary> {
  const transactions = await listTransactionsForProject(supabase, projectId);
  const rows = await listLedgerRowsForTransactionIds(
    supabase,
    transactions.map((t) => t.id),
  );
  return computeProjectFinancialSummary(rows);
}
