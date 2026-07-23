import type { Metadata } from "next";
import { fetchFinancialCategories } from "@/application/financial/financialLookupsActions";
import { fetchFinancialTransactions } from "@/application/financial/financialTransactionsActions";
import { getClientFilterOptions } from "@/application/projects/projectsQueries";
import { FinancialBoard } from "@/components/financial/FinancialBoard";
import { FinancialFilterBar } from "@/components/financial/FinancialFilterBar";
import type { FinancialTransactionKind, FinancialTransactionStatus } from "@/types/financial";

export const metadata: Metadata = {
  title: "Lançamentos — Financeiro",
};

export default async function FinancialTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    kind?: string;
    status?: string;
    categoryId?: string;
    clientId?: string;
    dueFrom?: string;
    dueTo?: string;
  }>;
}) {
  const params = await searchParams;

  const [{ transactions }, categories, clients] = await Promise.all([
    fetchFinancialTransactions({
      search: params.q,
      kind: (params.kind as FinancialTransactionKind) || undefined,
      status: (params.status as FinancialTransactionStatus) || undefined,
      categoryId: params.categoryId || undefined,
      clientId: params.clientId || undefined,
      dueFrom: params.dueFrom,
      dueTo: params.dueTo,
    }),
    fetchFinancialCategories(),
    getClientFilterOptions(),
  ]);

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--primary)" }}>Lançamentos</h1>
      <p className="crm-card-sub" style={{ marginTop: 4, marginBottom: 20 }}>
        Receitas e despesas — cadastro, parcelamento, documentos.
      </p>

      <FinancialFilterBar categories={categories} clients={clients} />

      <div style={{ marginTop: 16 }}>
        <FinancialBoard transactions={transactions} />
      </div>
    </div>
  );
}
