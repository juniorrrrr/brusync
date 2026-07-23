import type {
  FinancialAccountType,
  FinancialCategoryKind,
  FinancialDocumentType,
  FinancialTransactionKind,
  FinancialTransactionStatus,
} from "@/types/financial";

export const FINANCIAL_ACCOUNT_TYPES: FinancialAccountType[] = ["caixa", "banco", "outro"];
export const FINANCIAL_ACCOUNT_TYPE_LABEL: Record<FinancialAccountType, string> = {
  caixa: "Caixa",
  banco: "Banco",
  outro: "Outro",
};

export const FINANCIAL_CATEGORY_KINDS: FinancialCategoryKind[] = ["receita", "despesa"];

export const FINANCIAL_TRANSACTION_KINDS: FinancialTransactionKind[] = ["receita", "despesa"];
export const FINANCIAL_TRANSACTION_KIND_LABEL: Record<FinancialTransactionKind, string> = {
  receita: "Receita",
  despesa: "Despesa",
};

export const FINANCIAL_STATUSES: FinancialTransactionStatus[] = [
  "previsto",
  "pago",
  "parcial",
  "vencido",
  "cancelado",
];

/** Same status vocabulary serves receita and despesa — "pago" reads as
 * "Recebido" for a receita and "Pago" for a despesa; this map returns the
 * label for the given kind rather than duplicating the whole status enum. */
export function financialStatusLabel(
  status: FinancialTransactionStatus,
  kind: FinancialTransactionKind,
): string {
  if (status === "pago") return kind === "receita" ? "Recebido" : "Pago";
  if (status === "parcial") return "Parcial";
  if (status === "vencido") return "Vencido";
  if (status === "cancelado") return "Cancelado";
  return "Previsto";
}

export function financialStatusBadge(status: FinancialTransactionStatus): string {
  switch (status) {
    case "pago":
      return "ok";
    case "parcial":
      return "warn";
    case "vencido":
      return "danger";
    case "cancelado":
      return "neutral";
    default:
      return "info";
  }
}

export const FINANCIAL_DOCUMENT_TYPES: FinancialDocumentType[] = [
  "contrato",
  "nota",
  "comprovante",
  "recibo",
  "outro",
];
export const FINANCIAL_DOCUMENT_TYPE_LABEL: Record<FinancialDocumentType, string> = {
  contrato: "Contrato",
  nota: "Nota",
  comprovante: "Comprovante",
  recibo: "Recibo",
  outro: "Outro",
};
