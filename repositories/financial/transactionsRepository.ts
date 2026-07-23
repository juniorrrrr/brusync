import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { FinancialLedgerRow } from "@/domain/financial/calculations";
import type { FinancialMarketingLedgerRow } from "@/domain/financial/marketing";
import type {
  FinancialInstallmentStatus,
  FinancialTransaction,
  FinancialTransactionKind,
  FinancialTransactionStatus,
} from "@/types/financial";

interface TransactionRow {
  id: string;
  kind: FinancialTransactionKind;
  status: FinancialTransactionStatus;
  description: string;
  amount: number;
  due_date: string | null;
  paid_at: string | null;
  account_id: string | null;
  category_id: string | null;
  client_id: string | null;
  project_id: string | null;
  crm_lead_id: string | null;
  conversion_event_id: string | null;
  supplier: string | null;
  cost_center: string | null;
  installments_count: number;
  created_at: string;
  updated_at: string;
  account: { name: string } | null;
  category: { name: string } | null;
  client: { company: string } | null;
  project: { name: string } | null;
  crmLead: { name: string } | null;
}

const TRANSACTION_SELECT = `
  id, kind, status, description, amount, due_date, paid_at,
  account_id, category_id, client_id, project_id, crm_lead_id, conversion_event_id,
  supplier, cost_center, installments_count, created_at, updated_at,
  account:crm_financial_accounts!crm_financial_transactions_account_id_fkey (name),
  category:crm_financial_categories!crm_financial_transactions_category_id_fkey (name),
  client:clients!crm_financial_transactions_client_id_fkey (company),
  project:crm_projects!crm_financial_transactions_project_id_fkey (name),
  crmLead:crm_leads!crm_financial_transactions_crm_lead_id_fkey (name)
`;

function mapTransaction(row: TransactionRow): FinancialTransaction {
  return {
    id: row.id,
    kind: row.kind,
    status: row.status,
    description: row.description,
    amount: row.amount,
    dueDate: row.due_date,
    paidAt: row.paid_at,
    accountId: row.account_id,
    accountName: row.account?.name ?? null,
    categoryId: row.category_id,
    categoryName: row.category?.name ?? null,
    clientId: row.client_id,
    clientCompany: row.client?.company ?? null,
    projectId: row.project_id,
    projectName: row.project?.name ?? null,
    crmLeadId: row.crm_lead_id,
    crmLeadName: row.crmLead?.name ?? null,
    conversionEventId: row.conversion_event_id,
    supplier: row.supplier,
    costCenter: row.cost_center,
    installmentsCount: row.installments_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface ListTransactionsOptions {
  kind?: FinancialTransactionKind;
  status?: FinancialTransactionStatus;
  clientId?: string;
  projectId?: string;
  categoryId?: string;
  search?: string;
  dueFrom?: string;
  dueTo?: string;
  limit?: number;
  offset?: number;
}

export interface TransactionsPage {
  transactions: FinancialTransaction[];
  total: number;
}

export async function listTransactions(
  supabase: SupabaseClient,
  options: ListTransactionsOptions = {},
): Promise<TransactionsPage> {
  let query = supabase
    .from("crm_financial_transactions")
    .select(TRANSACTION_SELECT, { count: "exact" });

  if (options.kind) query = query.eq("kind", options.kind);
  if (options.status) query = query.eq("status", options.status);
  if (options.clientId) query = query.eq("client_id", options.clientId);
  if (options.projectId) query = query.eq("project_id", options.projectId);
  if (options.categoryId) query = query.eq("category_id", options.categoryId);
  if (options.dueFrom) query = query.gte("due_date", options.dueFrom);
  if (options.dueTo) query = query.lte("due_date", options.dueTo);
  if (options.search) {
    const term = options.search.replace(/[,()%]/g, " ").trim();
    if (term) query = query.ilike("description", `%${term}%`);
  }

  const { data, error, count } = await query
    .order("due_date", { ascending: false, nullsFirst: false })
    .range(options.offset ?? 0, (options.offset ?? 0) + (options.limit ?? 50) - 1);

  if (error) throw new Error(`Falha ao carregar lançamentos: ${error.message}`);

  const transactions = ((data ?? []) as unknown as TransactionRow[]).map(mapTransaction);
  return { transactions, total: count ?? transactions.length };
}

export async function listTransactionsForClient(
  supabase: SupabaseClient,
  clientId: string,
): Promise<FinancialTransaction[]> {
  const { data, error } = await supabase
    .from("crm_financial_transactions")
    .select(TRANSACTION_SELECT)
    .eq("client_id", clientId)
    .order("due_date", { ascending: false, nullsFirst: false });

  if (error) throw new Error(`Falha ao carregar lançamentos do cliente: ${error.message}`);
  return ((data ?? []) as unknown as TransactionRow[]).map(mapTransaction);
}

export async function listTransactionsForProject(
  supabase: SupabaseClient,
  projectId: string,
): Promise<FinancialTransaction[]> {
  const { data, error } = await supabase
    .from("crm_financial_transactions")
    .select(TRANSACTION_SELECT)
    .eq("project_id", projectId)
    .order("due_date", { ascending: false, nullsFirst: false });

  if (error) throw new Error(`Falha ao carregar lançamentos do projeto: ${error.message}`);
  return ((data ?? []) as unknown as TransactionRow[]).map(mapTransaction);
}

export async function getTransactionById(
  supabase: SupabaseClient,
  id: string,
): Promise<FinancialTransaction | null> {
  const { data, error } = await supabase
    .from("crm_financial_transactions")
    .select(TRANSACTION_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Falha ao carregar lançamento: ${error.message}`);
  return data ? mapTransaction(data as unknown as TransactionRow) : null;
}

export interface CreateTransactionPayload {
  kind: FinancialTransactionKind;
  description: string;
  amount: number;
  dueDate: string | null;
  accountId: string | null;
  categoryId: string | null;
  clientId: string | null;
  projectId: string | null;
  crmLeadId: string | null;
  conversionEventId: string | null;
  supplier: string | null;
  costCenter: string | null;
  installmentsCount: number;
  createdBy: string | null;
}

export async function createTransaction(
  supabase: SupabaseClient,
  payload: CreateTransactionPayload,
): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from("crm_financial_transactions")
    .insert({
      kind: payload.kind,
      description: payload.description,
      amount: payload.amount,
      due_date: payload.dueDate,
      account_id: payload.accountId,
      category_id: payload.categoryId,
      client_id: payload.clientId,
      project_id: payload.projectId,
      crm_lead_id: payload.crmLeadId,
      conversion_event_id: payload.conversionEventId,
      supplier: payload.supplier,
      cost_center: payload.costCenter,
      installments_count: payload.installmentsCount,
      created_by: payload.createdBy,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Falha ao criar lançamento: ${error.message}`);
  return data as { id: string };
}

export interface UpdateTransactionPayload {
  description?: string;
  amount?: number;
  status?: FinancialTransactionStatus;
  dueDate?: string | null;
  paidAt?: string | null;
  accountId?: string | null;
  categoryId?: string | null;
  supplier?: string | null;
  costCenter?: string | null;
}

export async function updateTransaction(
  supabase: SupabaseClient,
  id: string,
  patch: UpdateTransactionPayload,
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (patch.description !== undefined) payload.description = patch.description;
  if (patch.amount !== undefined) payload.amount = patch.amount;
  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.dueDate !== undefined) payload.due_date = patch.dueDate;
  if (patch.paidAt !== undefined) payload.paid_at = patch.paidAt;
  if (patch.accountId !== undefined) payload.account_id = patch.accountId;
  if (patch.categoryId !== undefined) payload.category_id = patch.categoryId;
  if (patch.supplier !== undefined) payload.supplier = patch.supplier;
  if (patch.costCenter !== undefined) payload.cost_center = patch.costCenter;

  const { error } = await supabase.from("crm_financial_transactions").update(payload).eq("id", id);
  if (error) throw new Error(`Falha ao atualizar lançamento: ${error.message}`);
}

export async function deleteTransaction(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("crm_financial_transactions").delete().eq("id", id);
  if (error) throw new Error(`Falha ao excluir lançamento: ${error.message}`);
}

interface LedgerInstallmentRow {
  amount: number;
  due_date: string;
  paid_at: string | null;
  status: FinancialInstallmentStatus;
  transaction: {
    kind: FinancialTransactionKind;
    client_id: string | null;
    project_id: string | null;
    category: { name: string } | null;
    client: { company: string } | null;
    project: { name: string } | null;
    crmLead: { origin: string | null } | null;
  } | null;
}

const LEDGER_SELECT = `
  amount, due_date, paid_at, status,
  transaction:crm_financial_transactions!crm_financial_installments_transaction_id_fkey (
    kind, client_id, project_id,
    category:crm_financial_categories!crm_financial_transactions_category_id_fkey (name),
    client:clients!crm_financial_transactions_client_id_fkey (company),
    project:crm_projects!crm_financial_transactions_project_id_fkey (name),
    crmLead:crm_leads!crm_financial_transactions_crm_lead_id_fkey (origin)
  )
`;

function mapLedgerRows(data: unknown): FinancialLedgerRow[] {
  return ((data ?? []) as unknown as LedgerInstallmentRow[])
    .filter((row) => row.transaction)
    .map((row) => {
      const t = row.transaction as NonNullable<LedgerInstallmentRow["transaction"]>;
      return {
        transactionId: "",
        kind: t.kind,
        status: row.status,
        amount: row.amount,
        dueDate: row.due_date,
        paidAt: row.paid_at,
        categoryName: t.category?.name ?? null,
        clientId: t.client_id,
        clientCompany: t.client?.company ?? null,
        projectId: t.project_id,
        projectName: t.project?.name ?? null,
        origin: t.crmLead?.origin ?? null,
      };
    });
}

/** Powers the dashboard and every summary computation — installments, not
 * transactions, are the real ledger (see domain/financial/calculations.ts). */
export async function listLedgerRows(supabase: SupabaseClient): Promise<FinancialLedgerRow[]> {
  const { data, error } = await supabase.from("crm_financial_installments").select(LEDGER_SELECT);

  if (error) throw new Error(`Falha ao carregar lançamentos financeiros: ${error.message}`);
  return mapLedgerRows(data);
}

/** Same ledger shape, scoped to a specific set of transactions — used by
 * the Cliente/Projeto financial summaries so they don't need to pull every
 * installment in the company just to filter client-side. */
export async function listLedgerRowsForTransactionIds(
  supabase: SupabaseClient,
  transactionIds: string[],
): Promise<FinancialLedgerRow[]> {
  if (transactionIds.length === 0) return [];

  const { data, error } = await supabase
    .from("crm_financial_installments")
    .select(LEDGER_SELECT)
    .in("transaction_id", transactionIds);

  if (error) throw new Error(`Falha ao carregar lançamentos financeiros: ${error.message}`);
  return mapLedgerRows(data);
}

interface MarketingLedgerRow {
  amount: number;
  paid_at: string | null;
  status: FinancialInstallmentStatus;
  transaction: {
    kind: FinancialTransactionKind;
    client_id: string | null;
    conversionEvent: {
      campaign_key: string | null;
      utm_source: string | null;
      utm_medium: string | null;
    } | null;
    crmLead: { origin: string | null; city: string | null } | null;
    project: { owner: { name: string | null; email: string | null } | null } | null;
  } | null;
}

const MARKETING_LEDGER_SELECT = `
  amount, paid_at, status,
  transaction:crm_financial_transactions!crm_financial_installments_transaction_id_fkey (
    kind, client_id,
    conversionEvent:conversion_events!crm_financial_transactions_conversion_event_id_fkey (campaign_key, utm_source, utm_medium),
    crmLead:crm_leads!crm_financial_transactions_crm_lead_id_fkey (origin, city),
    project:crm_projects!crm_financial_transactions_project_id_fkey (
      owner:profiles!crm_projects_owner_id_fkey (name, email)
    )
  )
`;

export async function listMarketingLedgerRows(
  supabase: SupabaseClient,
): Promise<FinancialMarketingLedgerRow[]> {
  const { data, error } = await supabase
    .from("crm_financial_installments")
    .select(MARKETING_LEDGER_SELECT)
    .eq("status", "pago");

  if (error)
    throw new Error(`Falha ao carregar indicadores financeiros de marketing: ${error.message}`);

  return ((data ?? []) as unknown as MarketingLedgerRow[])
    .filter((row) => row.transaction?.kind === "receita")
    .map((row) => {
      const t = row.transaction as NonNullable<MarketingLedgerRow["transaction"]>;
      return {
        amount: row.amount,
        clientId: t.client_id,
        campaignKey: t.conversionEvent?.campaign_key ?? null,
        utmSource: t.conversionEvent?.utm_source ?? null,
        utmMedium: t.conversionEvent?.utm_medium ?? null,
        origin: t.crmLead?.origin ?? null,
        ownerName: t.project?.owner?.name ?? t.project?.owner?.email ?? null,
        city: t.crmLead?.city ?? null,
      };
    });
}
