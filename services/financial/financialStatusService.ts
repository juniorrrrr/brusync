import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  listInstallmentsForTransaction,
  updateInstallmentStatus,
} from "@/repositories/financial/installmentsRepository";
import { updateTransaction } from "@/repositories/financial/transactionsRepository";
import type { FinancialTransactionStatus } from "@/types/financial";

/** After any installment changes, the parent transaction's own status is
 * re-derived from its installments — never edited directly except to
 * "cancelado" (a manual terminal state this never overrides). All-paid →
 * "pago", some-but-not-all-paid → "parcial", none-paid-but-overdue →
 * "vencido", otherwise "previsto". */
async function recomputeTransactionStatus(
  supabase: SupabaseClient,
  transactionId: string,
): Promise<void> {
  const installments = await listInstallmentsForTransaction(supabase, transactionId);
  if (installments.length === 0) return;

  const paidCount = installments.filter((i) => i.status === "pago").length;
  const now = new Date().toISOString();

  let status: FinancialTransactionStatus;
  let paidAt: string | null = null;

  if (paidCount === installments.length) {
    status = "pago";
    paidAt =
      installments
        .map((i) => i.paidAt)
        .filter(Boolean)
        .sort()
        .at(-1) ?? now;
  } else if (paidCount > 0) {
    status = "parcial";
  } else if (installments.some((i) => i.dueDate < now)) {
    status = "vencido";
  } else {
    status = "previsto";
  }

  await updateTransaction(supabase, transactionId, { status, paidAt });
}

export async function markInstallmentPaid(
  supabase: SupabaseClient,
  installmentId: string,
  transactionId: string,
): Promise<void> {
  await updateInstallmentStatus(supabase, installmentId, "pago", new Date().toISOString());
  await recomputeTransactionStatus(supabase, transactionId);
}

export async function reopenInstallment(
  supabase: SupabaseClient,
  installmentId: string,
  transactionId: string,
): Promise<void> {
  await updateInstallmentStatus(supabase, installmentId, "pendente", null);
  await recomputeTransactionStatus(supabase, transactionId);
}

export async function cancelTransaction(
  supabase: SupabaseClient,
  transactionId: string,
): Promise<void> {
  await updateTransaction(supabase, transactionId, { status: "cancelado" });
}
