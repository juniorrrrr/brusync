import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { FinancialInstallment, FinancialInstallmentStatus } from "@/types/financial";

interface InstallmentRow {
  id: string;
  transaction_id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  paid_at: string | null;
  status: FinancialInstallmentStatus;
}

function mapInstallment(row: InstallmentRow): FinancialInstallment {
  return {
    id: row.id,
    transactionId: row.transaction_id,
    installmentNumber: row.installment_number,
    amount: row.amount,
    dueDate: row.due_date,
    paidAt: row.paid_at,
    status: row.status,
  };
}

const INSTALLMENT_SELECT =
  "id, transaction_id, installment_number, amount, due_date, paid_at, status";

export async function listInstallmentsForTransaction(
  supabase: SupabaseClient,
  transactionId: string,
): Promise<FinancialInstallment[]> {
  const { data, error } = await supabase
    .from("crm_financial_installments")
    .select(INSTALLMENT_SELECT)
    .eq("transaction_id", transactionId)
    .order("installment_number", { ascending: true });

  if (error) throw new Error(`Falha ao carregar parcelas: ${error.message}`);
  return ((data ?? []) as unknown as InstallmentRow[]).map(mapInstallment);
}

export interface CreateInstallmentPayload {
  transactionId: string;
  installmentNumber: number;
  amount: number;
  dueDate: string;
}

export async function createInstallments(
  supabase: SupabaseClient,
  installments: CreateInstallmentPayload[],
): Promise<void> {
  const { error } = await supabase.from("crm_financial_installments").insert(
    installments.map((i) => ({
      transaction_id: i.transactionId,
      installment_number: i.installmentNumber,
      amount: i.amount,
      due_date: i.dueDate,
    })),
  );
  if (error) throw new Error(`Falha ao criar parcelas: ${error.message}`);
}

export async function updateInstallmentStatus(
  supabase: SupabaseClient,
  id: string,
  status: FinancialInstallmentStatus,
  paidAt: string | null,
): Promise<void> {
  const { error } = await supabase
    .from("crm_financial_installments")
    .update({ status, paid_at: paidAt })
    .eq("id", id);
  if (error) throw new Error(`Falha ao atualizar parcela: ${error.message}`);
}
