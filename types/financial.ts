export type FinancialAccountType = "caixa" | "banco" | "outro";

export interface FinancialAccount {
  id: string;
  name: string;
  type: FinancialAccountType;
  createdAt: string;
}

export type FinancialCategoryKind = "receita" | "despesa";

export interface FinancialCategory {
  id: string;
  name: string;
  kind: FinancialCategoryKind;
  isDefault: boolean;
}

export type FinancialTransactionKind = "receita" | "despesa";

export type FinancialTransactionStatus = "previsto" | "pago" | "parcial" | "vencido" | "cancelado";

/** Same idea as FinancialTransactionStatus but the DB's initial state for
 * an installment row is "pendente", not "previsto" — kept as a distinct
 * type so the two never get silently mixed up. */
export type FinancialInstallmentStatus = "pendente" | "pago" | "parcial" | "vencido" | "cancelado";

export type FinancialDocumentType = "contrato" | "nota" | "comprovante" | "recibo" | "outro";

export interface FinancialInstallment {
  id: string;
  transactionId: string;
  installmentNumber: number;
  amount: number;
  dueDate: string;
  paidAt: string | null;
  status: FinancialInstallmentStatus;
}

export interface FinancialDocument {
  id: string;
  transactionId: string;
  documentType: FinancialDocumentType;
  storagePath: string;
  fileName: string;
  fileSize: number | null;
  mimeType: string | null;
  uploadedBy: string | null;
  uploadedByName: string | null;
  createdAt: string;
}

export interface FinancialTransaction {
  id: string;
  kind: FinancialTransactionKind;
  status: FinancialTransactionStatus;
  description: string;
  amount: number;
  dueDate: string | null;
  paidAt: string | null;
  accountId: string | null;
  accountName: string | null;
  categoryId: string | null;
  categoryName: string | null;
  clientId: string | null;
  clientCompany: string | null;
  projectId: string | null;
  projectName: string | null;
  crmLeadId: string | null;
  crmLeadName: string | null;
  conversionEventId: string | null;
  supplier: string | null;
  costCenter: string | null;
  installmentsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialTransactionDetail extends FinancialTransaction {
  installments: FinancialInstallment[];
  documents: FinancialDocument[];
}

export interface FinancialMonthlyPoint {
  month: string; // "2026-07"
  label: string; // "Jul/26"
  revenue: number;
  expense: number;
  netCashFlow: number;
}

export interface FinancialBreakdownItem {
  label: string;
  value: number;
}

export interface FinancialDashboardData {
  expectedRevenue: number;
  receivedRevenue: number;
  monthRevenue: number;
  monthExpense: number;
  grossProfit: number;
  cashFlow: number;
  overdueCount: number;
  overdueAmount: number;
  upcomingCount: number;
  upcomingAmount: number;
  averageTicket: number;
  averageMargin: number | null;
  monthlySeries: FinancialMonthlyPoint[];
  expenseByCategory: FinancialBreakdownItem[];
  revenueByClient: FinancialBreakdownItem[];
  revenueByProject: FinancialBreakdownItem[];
  revenueByOrigin: FinancialBreakdownItem[];
}

export interface ClientFinancialSummary {
  totalRevenue: number;
  receivedRevenue: number;
  invoicedProjectsCount: number;
  averageTicket: number;
  lastPaymentAt: string | null;
}

export interface ProjectFinancialSummary {
  contractedValue: number;
  receivedValue: number;
  balance: number;
  percentReceived: number;
}

export interface FinancialMarketingIndicators {
  cac: number | null;
  roi: number | null;
  roas: number | null;
  totalSpend: number;
  totalRevenue: number;
  revenueByCampaign: FinancialBreakdownItem[];
  revenueByOrigin: FinancialBreakdownItem[];
  revenueByChannel: FinancialBreakdownItem[];
  revenueByUtmSource: FinancialBreakdownItem[];
  revenueByOwner: FinancialBreakdownItem[];
  revenueByCity: FinancialBreakdownItem[];
}
