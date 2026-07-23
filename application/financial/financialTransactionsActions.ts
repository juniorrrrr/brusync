"use server";

import { revalidatePath } from "next/cache";
import { requireCrmProfile } from "@/application/crm/authGuard";
import {
  getDemoFinancialTransactionDetail,
  getDemoFinancialTransactions,
} from "@/lib/demo/mockFinancial";
import {
  deleteTransaction,
  type ListTransactionsOptions,
  listTransactions,
  updateTransaction,
} from "@/repositories/financial/transactionsRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { cancelTransaction } from "@/services/financial/financialStatusService";
import {
  createTransactionWithInstallments,
  getTransactionDetail,
} from "@/services/financial/financialTransactionService";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { FinancialTransactionKind } from "@/types/financial";

const DEMO_WRITE_BLOCKED_MESSAGE =
  "Ação indisponível em Modo Demonstração — nenhuma escrita é enviada ao banco.";

export async function fetchFinancialTransactions(options: ListTransactionsOptions = {}) {
  await requireCrmProfile();
  if (await isDemoModeActive()) return getDemoFinancialTransactions();

  const supabase = await getSupabaseAuthClient();
  return listTransactions(supabase, options);
}

export async function fetchFinancialTransactionDetail(id: string) {
  await requireCrmProfile();
  if (await isDemoModeActive()) return getDemoFinancialTransactionDetail(id);

  const supabase = await getSupabaseAuthClient();
  return getTransactionDetail(supabase, id);
}

export interface TransactionActionState {
  status: "idle" | "success" | "error";
  message?: string;
  transactionId?: string;
}

export async function saveTransactionAction(
  _prevState: TransactionActionState,
  formData: FormData,
): Promise<TransactionActionState> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  const id = String(formData.get("id") ?? "").trim();
  const kind = String(formData.get("kind") ?? "receita") as FinancialTransactionKind;
  const description = String(formData.get("description") ?? "").trim();
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const amount = Number(amountRaw.replace(",", "."));

  if (!description) return { status: "error", message: "Informe uma descrição." };
  if (!amountRaw || Number.isNaN(amount) || amount <= 0) {
    return { status: "error", message: "Informe um valor válido." };
  }

  const dueDateRaw = String(formData.get("dueDate") ?? "").trim();
  const dueDate = dueDateRaw ? new Date(dueDateRaw).toISOString() : null;
  const accountId = String(formData.get("accountId") ?? "").trim() || null;
  const categoryId = String(formData.get("categoryId") ?? "").trim() || null;
  const clientId = String(formData.get("clientId") ?? "").trim() || null;
  const projectId = String(formData.get("projectId") ?? "").trim() || null;
  const supplier = String(formData.get("supplier") ?? "").trim() || null;
  const costCenter = String(formData.get("costCenter") ?? "").trim() || null;
  const installmentsCount = Math.max(1, Number(formData.get("installmentsCount") ?? 1) || 1);

  const supabase = await getSupabaseAuthClient();

  if (id) {
    await updateTransaction(supabase, id, {
      description,
      amount,
      dueDate,
      accountId,
      categoryId,
      supplier,
      costCenter,
    });
    revalidatePath("/financeiro");
    return { status: "success", message: "Lançamento atualizado.", transactionId: id };
  }

  if (!categoryId) return { status: "error", message: "Selecione uma categoria." };

  const { id: newId } = await createTransactionWithInstallments(supabase, {
    kind,
    description,
    amount,
    dueDate,
    accountId,
    categoryId,
    clientId,
    projectId,
    crmLeadId: null,
    conversionEventId: null,
    supplier,
    costCenter,
    installmentsCount,
    createdBy: profile.id,
  });

  revalidatePath("/financeiro");
  return { status: "success", message: "Lançamento criado.", transactionId: newId };
}

export async function deleteTransactionAction(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };

  const supabase = await getSupabaseAuthClient();
  await deleteTransaction(supabase, id);
  revalidatePath("/financeiro");
  return { ok: true };
}

export async function cancelTransactionAction(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };

  const supabase = await getSupabaseAuthClient();
  await cancelTransaction(supabase, id);
  revalidatePath("/financeiro");
  return { ok: true };
}
