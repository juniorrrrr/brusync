import type {
  ClientFinancialSummary,
  FinancialBreakdownItem,
  FinancialDashboardData,
  FinancialInstallmentStatus,
  FinancialMonthlyPoint,
  FinancialTransactionKind,
  ProjectFinancialSummary,
} from "@/types/financial";

/** Every transaction always has at least one installment row (a
 * non-parcelado transaction still gets exactly one, covering the full
 * amount) — installments are the single source of truth for "how much was
 * actually paid and when", never the parent transaction's own amount/status.
 * Every dashboard/summary computation below operates on this flattened
 * ledger row, built by the repository from a transaction+installments join. */
export interface FinancialLedgerRow {
  transactionId: string;
  kind: FinancialTransactionKind;
  status: FinancialInstallmentStatus;
  amount: number;
  dueDate: string | null;
  paidAt: string | null;
  categoryName: string | null;
  clientId: string | null;
  clientCompany: string | null;
  projectId: string | null;
  projectName: string | null;
  origin: string | null;
}

const MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit" });

function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

function monthLabel(monthKeyValue: string): string {
  const [year, month] = monthKeyValue.split("-").map(Number);
  const label = MONTH_LABEL_FORMATTER.format(new Date(year, month - 1, 1));
  return label.charAt(0).toUpperCase() + label.slice(1).replace(".", "");
}

function isPaid(row: FinancialLedgerRow): boolean {
  return row.status === "pago";
}

function isActive(row: FinancialLedgerRow): boolean {
  return row.status !== "cancelado";
}

export function computeProjectFinancialSummary(
  rows: FinancialLedgerRow[],
): ProjectFinancialSummary {
  const revenueRows = rows.filter((r) => r.kind === "receita" && isActive(r));
  const contractedValue = revenueRows.reduce((sum, r) => sum + r.amount, 0);
  const receivedValue = revenueRows.filter(isPaid).reduce((sum, r) => sum + r.amount, 0);
  const balance = contractedValue - receivedValue;
  const percentReceived =
    contractedValue > 0 ? Math.round((receivedValue / contractedValue) * 100) : 0;

  return { contractedValue, receivedValue, balance, percentReceived };
}

export function computeClientFinancialSummary(rows: FinancialLedgerRow[]): ClientFinancialSummary {
  const revenueRows = rows.filter((r) => r.kind === "receita" && isActive(r));
  const totalRevenue = revenueRows.reduce((sum, r) => sum + r.amount, 0);
  const paidRows = revenueRows.filter(isPaid);
  const receivedRevenue = paidRows.reduce((sum, r) => sum + r.amount, 0);
  const invoicedProjectsCount = new Set(paidRows.map((r) => r.projectId).filter(Boolean)).size;
  const averageTicket = paidRows.length > 0 ? receivedRevenue / paidRows.length : 0;
  const lastPaymentAt =
    paidRows
      .map((r) => r.paidAt)
      .filter((d): d is string => Boolean(d))
      .sort((a, b) => b.localeCompare(a))[0] ?? null;

  return { totalRevenue, receivedRevenue, invoicedProjectsCount, averageTicket, lastPaymentAt };
}

function buildBreakdown(
  rows: FinancialLedgerRow[],
  keyFn: (row: FinancialLedgerRow) => string,
  limit = 8,
): FinancialBreakdownItem[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const key = keyFn(row);
    totals.set(key, (totals.get(key) ?? 0) + row.amount);
  }
  return [...totals.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

export function buildMonthlySeries(
  rows: FinancialLedgerRow[],
  months = 6,
): FinancialMonthlyPoint[] {
  const now = new Date();
  const keys: string[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const revenueByMonth = new Map<string, number>();
  const expenseByMonth = new Map<string, number>();

  for (const row of rows) {
    if (!isPaid(row) || !row.paidAt) continue;
    const key = monthKey(row.paidAt);
    if (row.kind === "receita") {
      revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + row.amount);
    } else {
      expenseByMonth.set(key, (expenseByMonth.get(key) ?? 0) + row.amount);
    }
  }

  return keys.map((key) => {
    const revenue = revenueByMonth.get(key) ?? 0;
    const expense = expenseByMonth.get(key) ?? 0;
    return { month: key, label: monthLabel(key), revenue, expense, netCashFlow: revenue - expense };
  });
}

const UPCOMING_WINDOW_DAYS = 30;

export function buildFinancialDashboardData(rows: FinancialLedgerRow[]): FinancialDashboardData {
  const now = new Date();
  const nowIso = now.toISOString();
  const upcomingLimit = new Date(
    now.getTime() + UPCOMING_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const activeRows = rows.filter(isActive);
  const revenueRows = activeRows.filter((r) => r.kind === "receita");
  const expenseRows = activeRows.filter((r) => r.kind === "despesa");

  const expectedRevenue = revenueRows.reduce((sum, r) => sum + r.amount, 0);
  const receivedRevenue = revenueRows.filter(isPaid).reduce((sum, r) => sum + r.amount, 0);

  const monthRevenue = revenueRows
    .filter((r) => isPaid(r) && r.paidAt && r.paidAt >= monthStart)
    .reduce((sum, r) => sum + r.amount, 0);
  const monthExpense = expenseRows
    .filter((r) => isPaid(r) && r.paidAt && r.paidAt >= monthStart)
    .reduce((sum, r) => sum + r.amount, 0);

  const grossProfit = monthRevenue - monthExpense;
  const totalPaidExpense = expenseRows.filter(isPaid).reduce((sum, r) => sum + r.amount, 0);
  const cashFlow = receivedRevenue - totalPaidExpense;

  const overdueRows = activeRows.filter(
    (r) => !isPaid(r) && r.status !== "cancelado" && r.dueDate && r.dueDate < nowIso,
  );
  const overdueCount = overdueRows.length;
  const overdueAmount = overdueRows.reduce((sum, r) => sum + r.amount, 0);

  const upcomingRows = activeRows.filter(
    (r) => !isPaid(r) && r.dueDate && r.dueDate >= nowIso && r.dueDate <= upcomingLimit,
  );
  const upcomingCount = upcomingRows.length;
  const upcomingAmount = upcomingRows.reduce((sum, r) => sum + r.amount, 0);

  const paidRevenueRows = revenueRows.filter(isPaid);
  const averageTicket = paidRevenueRows.length > 0 ? receivedRevenue / paidRevenueRows.length : 0;

  const averageMargin =
    receivedRevenue > 0
      ? Math.round(((receivedRevenue - totalPaidExpense) / receivedRevenue) * 1000) / 10
      : null;

  return {
    expectedRevenue,
    receivedRevenue,
    monthRevenue,
    monthExpense,
    grossProfit,
    cashFlow,
    overdueCount,
    overdueAmount,
    upcomingCount,
    upcomingAmount,
    averageTicket,
    averageMargin,
    monthlySeries: buildMonthlySeries(activeRows),
    expenseByCategory: buildBreakdown(
      expenseRows.filter(isPaid),
      (r) => r.categoryName ?? "Outros",
    ),
    revenueByClient: buildBreakdown(paidRevenueRows, (r) => r.clientCompany ?? "Sem cliente"),
    revenueByProject: buildBreakdown(paidRevenueRows, (r) => r.projectName ?? "Sem projeto"),
    revenueByOrigin: buildBreakdown(paidRevenueRows, (r) => r.origin ?? "Sem origem"),
  };
}
