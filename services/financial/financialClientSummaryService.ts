import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { computeClientFinancialSummary } from "@/domain/financial/calculations";
import {
  listLedgerRowsForTransactionIds,
  listTransactionsForClient,
} from "@/repositories/financial/transactionsRepository";
import type { ClientFinancialSummary } from "@/types/financial";

export async function getClientFinancialSummary(
  supabase: SupabaseClient,
  clientId: string,
): Promise<ClientFinancialSummary> {
  const transactions = await listTransactionsForClient(supabase, clientId);
  const rows = await listLedgerRowsForTransactionIds(
    supabase,
    transactions.map((t) => t.id),
  );
  return computeClientFinancialSummary(rows);
}
