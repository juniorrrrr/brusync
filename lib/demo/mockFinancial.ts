import type { FinancialLedgerRow } from "@/domain/financial/calculations";
import {
  buildFinancialDashboardData,
  computeClientFinancialSummary,
  computeProjectFinancialSummary,
} from "@/domain/financial/calculations";
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_REVENUE_CATEGORIES,
} from "@/domain/financial/defaultCategories";
import {
  buildFinancialMarketingIndicators,
  type FinancialMarketingLedgerRow,
} from "@/domain/financial/marketing";
import { getDemoClientsPageData } from "@/lib/demo/mockCrm";
import { getDemoProjects } from "@/lib/demo/mockProjects";
import type {
  ClientFinancialSummary,
  FinancialAccount,
  FinancialCategory,
  FinancialTransaction,
  FinancialTransactionDetail,
  FinancialTransactionKind,
  FinancialTransactionStatus,
  ProjectFinancialSummary,
} from "@/types/financial";

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

const CAMPAIGNS = ["black-friday-2026", "lancamento-crm", "institucional", "indicacao"];
const CHANNELS = ["cpc", "social", "email", "organic"];
const CITIES = ["São Paulo", "Curitiba", "Belo Horizonte", "Recife"];

interface DemoPlan {
  kind: FinancialTransactionKind;
  status: FinancialTransactionStatus;
  amount: number;
  dueDaysFromNow: number;
  paidDaysAgo: number | null;
  category: string;
  clientIndex: number | null;
}

function planFor(index: number): DemoPlan {
  const patterns: DemoPlan[] = [
    {
      kind: "receita",
      status: "pago",
      amount: 18000,
      dueDaysFromNow: -20,
      paidDaysAgo: 18,
      category: "Receita de projeto",
      clientIndex: 0,
    },
    {
      kind: "receita",
      status: "pago",
      amount: 24500,
      dueDaysFromNow: -10,
      paidDaysAgo: 8,
      category: "Receita de projeto",
      clientIndex: 1,
    },
    {
      kind: "receita",
      status: "parcial",
      amount: 32000,
      dueDaysFromNow: -5,
      paidDaysAgo: 3,
      category: "Receita de projeto",
      clientIndex: 2,
    },
    {
      kind: "receita",
      status: "previsto",
      amount: 15000,
      dueDaysFromNow: 12,
      paidDaysAgo: null,
      category: "Receita de projeto",
      clientIndex: 3,
    },
    {
      kind: "receita",
      status: "vencido",
      amount: 9800,
      dueDaysFromNow: -6,
      paidDaysAgo: null,
      category: "Outras receitas",
      clientIndex: 4,
    },
    {
      kind: "receita",
      status: "pago",
      amount: 21000,
      dueDaysFromNow: -40,
      paidDaysAgo: 38,
      category: "Receita de projeto",
      clientIndex: 0,
    },
    {
      kind: "despesa",
      status: "pago",
      amount: 4200,
      dueDaysFromNow: -15,
      paidDaysAgo: 15,
      category: "Marketing",
      clientIndex: null,
    },
    {
      kind: "despesa",
      status: "pago",
      amount: 1800,
      dueDaysFromNow: -8,
      paidDaysAgo: 8,
      category: "Software",
      clientIndex: null,
    },
    {
      kind: "despesa",
      status: "pago",
      amount: 6500,
      dueDaysFromNow: -25,
      paidDaysAgo: 25,
      category: "Salários",
      clientIndex: null,
    },
    {
      kind: "despesa",
      status: "vencido",
      amount: 950,
      dueDaysFromNow: -4,
      paidDaysAgo: null,
      category: "Impostos",
      clientIndex: null,
    },
    {
      kind: "despesa",
      status: "previsto",
      amount: 1200,
      dueDaysFromNow: 9,
      paidDaysAgo: null,
      category: "Infraestrutura",
      clientIndex: null,
    },
    {
      kind: "despesa",
      status: "pago",
      amount: 3100,
      dueDaysFromNow: -55,
      paidDaysAgo: 52,
      category: "Terceiros",
      clientIndex: null,
    },
  ];
  return patterns[index % patterns.length];
}

function getDemoClientsAndProjects() {
  const { clients } = getDemoClientsPageData({});
  const { projects } = getDemoProjects();
  return { clients, projects };
}

function buildDemoTransactions(): FinancialTransaction[] {
  const { clients, projects } = getDemoClientsAndProjects();

  return Array.from({ length: 12 }, (_, index) => {
    const plan = planFor(index);
    const client = plan.clientIndex !== null ? clients[plan.clientIndex % clients.length] : null;
    const project = client ? projects.find((p) => p.clientId === client.id) : null;

    return {
      id: `00000000-f014-4000-8000-${String(index + 1).padStart(12, "0")}`,
      kind: plan.kind,
      status: plan.status,
      description:
        plan.kind === "receita"
          ? `${plan.category} — ${client?.company ?? "Diversos"}`
          : `${plan.category} do mês`,
      amount: plan.amount,
      dueDate: daysFromNow(plan.dueDaysFromNow),
      paidAt: plan.paidDaysAgo !== null ? daysFromNow(-plan.paidDaysAgo) : null,
      accountId: "00000000-f011-4000-8000-000000000001",
      accountName: "Banco Principal",
      categoryId: `00000000-f012-4000-8000-${plan.category.length.toString().padStart(12, "0")}`,
      categoryName: plan.category,
      clientId: client?.id ?? null,
      clientCompany: client?.company ?? null,
      projectId: project?.id ?? null,
      projectName: project?.name ?? null,
      crmLeadId: null,
      crmLeadName: null,
      conversionEventId: null,
      supplier: plan.kind === "despesa" ? "Fornecedor Demo Ltda." : null,
      costCenter: plan.kind === "despesa" ? "Operações" : null,
      installmentsCount: plan.status === "parcial" ? 3 : 1,
      createdAt: daysFromNow(plan.dueDaysFromNow - 30),
      updatedAt: daysFromNow(plan.paidDaysAgo !== null ? -plan.paidDaysAgo : plan.dueDaysFromNow),
    };
  });
}

function transactionToLedgerRows(transaction: FinancialTransaction): FinancialLedgerRow[] {
  const count = transaction.installmentsCount;
  const perInstallment = Math.round((transaction.amount / count) * 100) / 100;

  return Array.from({ length: count }, (_, index) => {
    const isLast = index === count - 1;
    const installmentPaid =
      transaction.status === "pago" || (transaction.status === "parcial" && index === 0);

    return {
      transactionId: transaction.id,
      kind: transaction.kind,
      status: installmentPaid ? "pago" : transaction.status === "vencido" ? "vencido" : "pendente",
      amount: isLast
        ? Math.round((transaction.amount - perInstallment * (count - 1)) * 100) / 100
        : perInstallment,
      dueDate: transaction.dueDate,
      paidAt: installmentPaid ? (transaction.paidAt ?? daysFromNow(-1)) : null,
      categoryName: transaction.categoryName,
      clientId: transaction.clientId,
      clientCompany: transaction.clientCompany,
      projectId: transaction.projectId,
      projectName: transaction.projectName,
      origin: transaction.clientId ? "Indicação" : null,
    };
  });
}

function buildDemoLedgerRows(): FinancialLedgerRow[] {
  return buildDemoTransactions().flatMap(transactionToLedgerRows);
}

export function getDemoFinancialAccounts(): FinancialAccount[] {
  return [
    {
      id: "00000000-f011-4000-8000-000000000001",
      name: "Banco Principal",
      type: "banco",
      createdAt: daysFromNow(-200),
    },
    {
      id: "00000000-f011-4000-8000-000000000002",
      name: "Caixa",
      type: "caixa",
      createdAt: daysFromNow(-200),
    },
  ];
}

export function getDemoFinancialCategories(): FinancialCategory[] {
  return [
    ...DEFAULT_REVENUE_CATEGORIES.map((name, index) => ({
      id: `00000000-f012-4000-8000-r${String(index).padStart(11, "0")}`,
      name,
      kind: "receita" as const,
      isDefault: true,
    })),
    ...DEFAULT_EXPENSE_CATEGORIES.map((name, index) => ({
      id: `00000000-f012-4000-8000-d${String(index).padStart(11, "0")}`,
      name,
      kind: "despesa" as const,
      isDefault: true,
    })),
  ];
}

export function getDemoFinancialTransactions(): {
  transactions: FinancialTransaction[];
  total: number;
} {
  const transactions = buildDemoTransactions();
  return { transactions, total: transactions.length };
}

export function getDemoFinancialTransactionDetail(id: string): FinancialTransactionDetail | null {
  const transaction = buildDemoTransactions().find((t) => t.id === id);
  if (!transaction) return null;

  const ledgerRows = transactionToLedgerRows(transaction);
  const installments = ledgerRows.map((row, index) => ({
    id: `${transaction.id}-installment-${index + 1}`,
    transactionId: transaction.id,
    installmentNumber: index + 1,
    amount: row.amount,
    dueDate: row.dueDate ?? daysFromNow(0),
    paidAt: row.paidAt,
    status: row.status,
  }));

  return { ...transaction, installments, documents: [] };
}

export function getDemoFinancialDashboardData() {
  return buildFinancialDashboardData(buildDemoLedgerRows());
}

export function getDemoClientFinancialSummary(clientId: string): ClientFinancialSummary {
  const rows = buildDemoLedgerRows().filter((r) => r.clientId === clientId);
  return computeClientFinancialSummary(rows);
}

export function getDemoProjectFinancialSummary(projectId: string): ProjectFinancialSummary {
  const rows = buildDemoLedgerRows().filter((r) => r.projectId === projectId);
  return computeProjectFinancialSummary(rows);
}

export function getDemoFinancialMarketingIndicators() {
  const revenueRows = buildDemoLedgerRows().filter(
    (r) => r.kind === "receita" && r.status === "pago",
  );

  const marketingRows: FinancialMarketingLedgerRow[] = revenueRows.map((row, index) => ({
    amount: row.amount,
    clientId: row.clientId,
    campaignKey: CAMPAIGNS[index % CAMPAIGNS.length],
    utmSource: CHANNELS[index % CHANNELS.length],
    utmMedium: CHANNELS[index % CHANNELS.length],
    origin: row.origin,
    ownerName: "Camila Rocha",
    city: CITIES[index % CITIES.length],
  }));

  return buildFinancialMarketingIndicators(marketingRows, 8500);
}
