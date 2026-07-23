import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { FinancialAccount, FinancialAccountType } from "@/types/financial";

interface AccountRow {
  id: string;
  name: string;
  type: FinancialAccountType;
  created_at: string;
}

function mapAccount(row: AccountRow): FinancialAccount {
  return { id: row.id, name: row.name, type: row.type, createdAt: row.created_at };
}

export async function listAccounts(supabase: SupabaseClient): Promise<FinancialAccount[]> {
  const { data, error } = await supabase
    .from("crm_financial_accounts")
    .select("id, name, type, created_at")
    .order("name", { ascending: true });

  if (error) throw new Error(`Falha ao carregar contas: ${error.message}`);
  return ((data ?? []) as unknown as AccountRow[]).map(mapAccount);
}

export async function createAccount(
  supabase: SupabaseClient,
  params: { name: string; type: FinancialAccountType; createdBy: string | null },
): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from("crm_financial_accounts")
    .insert({ name: params.name, type: params.type, created_by: params.createdBy })
    .select("id")
    .single();

  if (error) throw new Error(`Falha ao criar conta: ${error.message}`);
  return data as { id: string };
}

export async function deleteAccount(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("crm_financial_accounts").delete().eq("id", id);
  if (error) throw new Error(`Falha ao excluir conta: ${error.message}`);
}
