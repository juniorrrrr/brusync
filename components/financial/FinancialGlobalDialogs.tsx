"use client";

import { useRouter } from "next/navigation";
import { FinancialTransactionDialog } from "@/components/financial/FinancialTransactionDialog";
import type { FinancialAccount, FinancialCategory } from "@/types/financial";

/** Mounted once at the CRM shell (mirrors ProjectGlobalDialogs, Fase 12) —
 * reachable both from the main /financeiro list and from the
 * Cliente/Projeto drawers' quick-create buttons. */
export function FinancialGlobalDialogs({
  accounts,
  categories,
}: {
  accounts: FinancialAccount[];
  categories: FinancialCategory[];
}) {
  const router = useRouter();

  return (
    <FinancialTransactionDialog
      accounts={accounts}
      categories={categories}
      onSaved={() => router.refresh()}
    />
  );
}
