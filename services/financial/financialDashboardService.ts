import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { buildFinancialDashboardData } from "@/domain/financial/calculations";
import { listLedgerRows } from "@/repositories/financial/transactionsRepository";
import type { FinancialDashboardData } from "@/types/financial";

export async function getFinancialDashboardData(
  supabase: SupabaseClient,
): Promise<FinancialDashboardData> {
  const rows = await listLedgerRows(supabase);
  return buildFinancialDashboardData(rows);
}
