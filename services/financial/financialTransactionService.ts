import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { listDocumentsForTransaction } from "@/repositories/financial/documentsRepository";
import {
  createInstallments,
  listInstallmentsForTransaction,
} from "@/repositories/financial/installmentsRepository";
import {
  type CreateTransactionPayload,
  createTransaction,
  getTransactionById,
} from "@/repositories/financial/transactionsRepository";
import type { FinancialTransactionDetail } from "@/types/financial";

/** Adds calendar months while clamping to the last valid day of the target
 * month — a plain `date.setMonth(date.getMonth() + months)` on day 31
 * overflows into the next month whenever the target month has fewer than
 * 31 days (e.g. Aug 31 + 1 month silently becomes Oct 1, skipping
 * September entirely), which would throw off every installment's due date
 * for exactly the months clients are most likely to pick (30/31). */
function addMonths(iso: string, months: number): string {
  const date = new Date(iso);
  const day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + months);
  const daysInTargetMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(day, daysInTargetMonth));
  return date.toISOString();
}

/** Every transaction always gets at least one installment — a
 * non-parcelado transaction still gets exactly one, covering the full
 * amount, so installments remain the single source of truth for what was
 * actually paid (see domain/financial/calculations.ts). Parcelado
 * transactions split the amount evenly, remainder on the last one, one
 * installment per month starting from the transaction's own due date
 * (or today, if none was set). */
export async function createTransactionWithInstallments(
  supabase: SupabaseClient,
  payload: CreateTransactionPayload,
): Promise<{ id: string }> {
  const { id } = await createTransaction(supabase, payload);

  const count = Math.max(1, payload.installmentsCount);
  const baseDueDate = payload.dueDate ?? new Date().toISOString();
  const perInstallment = Math.floor((payload.amount / count) * 100) / 100;
  const lastInstallmentAmount =
    Math.round((payload.amount - perInstallment * (count - 1)) * 100) / 100;

  const installments = Array.from({ length: count }, (_, index) => ({
    transactionId: id,
    installmentNumber: index + 1,
    amount: index === count - 1 ? lastInstallmentAmount : perInstallment,
    dueDate: addMonths(baseDueDate, index),
  }));

  await createInstallments(supabase, installments);

  return { id };
}

export async function getTransactionDetail(
  supabase: SupabaseClient,
  id: string,
): Promise<FinancialTransactionDetail | null> {
  const transaction = await getTransactionById(supabase, id);
  if (!transaction) return null;

  const [installments, documents] = await Promise.all([
    listInstallmentsForTransaction(supabase, id),
    listDocumentsForTransaction(supabase, id),
  ]);

  return { ...transaction, installments, documents };
}
