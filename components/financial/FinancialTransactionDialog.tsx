"use client";

import { useActionState, useEffect, useState } from "react";
import {
  saveTransactionAction,
  type TransactionActionState,
} from "@/application/financial/financialTransactionsActions";
import { fetchProjectsForClient } from "@/application/projects/projectsActions";
import { FinancialDocumentsPanel } from "@/components/financial/FinancialDocumentsPanel";
import { FinancialInstallmentsPanel } from "@/components/financial/FinancialInstallmentsPanel";
import { ClientPicker } from "@/components/projects/ClientPicker";
import { useFinancialEditor } from "@/contexts/financial/FinancialEditorContext";
import { FINANCIAL_TRANSACTION_KIND_LABEL } from "@/domain/financial/types";
import type { FinancialAccount, FinancialCategory } from "@/types/financial";
import type { Project } from "@/types/projects";

const INITIAL_STATE: TransactionActionState = { status: "idle" };

function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export function FinancialTransactionDialog({
  accounts,
  categories,
  onSaved,
}: {
  accounts: FinancialAccount[];
  categories: FinancialCategory[];
  onSaved: () => void;
}) {
  const {
    mode,
    kind,
    transaction,
    fixedClientId,
    fixedClientCompany,
    fixedProjectId,
    loading,
    error,
    refresh,
    close,
  } = useFinancialEditor();
  const open = mode !== "closed";
  const [clientProjects, setClientProjects] = useState<Project[]>([]);

  const [state, formAction] = useActionState(async (prev: TransactionActionState, fd: FormData) => {
    const result = await saveTransactionAction(prev, fd);
    if (result.status === "success") {
      onSaved();
      if (mode === "create") close();
    }
    return result;
  }, INITIAL_STATE);

  useEffect(() => {
    if (!fixedClientId) return;
    fetchProjectsForClient(fixedClientId).then(setClientProjects);
  }, [fixedClientId]);

  if (!open) return null;

  const relevantCategories = categories.filter((c) => c.kind === kind);
  const isDespesa = kind === "despesa";

  return (
    <>
      <button type="button" aria-label="Fechar" className="crm-modal-overlay" onClick={close} />
      <div className="crm-modal-center">
        <div
          className="crm-modal"
          role="dialog"
          aria-modal="true"
          aria-label={mode === "create" ? "Novo lançamento" : "Editar lançamento"}
          style={{ maxWidth: 560, maxHeight: "88vh", overflowY: "auto" }}
        >
          <div className="crm-modal-head">
            <span className="crm-modal-title">
              {mode === "create"
                ? `Novo lançamento — ${FINANCIAL_TRANSACTION_KIND_LABEL[kind]}`
                : "Editar lançamento"}
            </span>
          </div>

          {loading && <div className="crm-drawer-loading">Carregando…</div>}
          {!loading && error && <div className="crm-drawer-empty">{error}</div>}

          {!loading && !error && (
            <form action={formAction} className="crm-modal-form" style={{ overflow: "visible" }}>
              {transaction && <input type="hidden" name="id" value={transaction.id} />}
              <input type="hidden" name="kind" value={kind} />

              {mode === "create" &&
                (fixedClientId ? (
                  <>
                    <input type="hidden" name="clientId" value={fixedClientId} />
                    {fixedClientCompany && (
                      <div className="crm-field">
                        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>
                          Cliente
                        </span>
                        <span>{fixedClientCompany}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <ClientPicker
                    name="clientId"
                    onSelectClient={(client) => {
                      fetchProjectsForClient(client.id).then(setClientProjects);
                    }}
                  />
                ))}

              {mode === "create" && fixedProjectId ? (
                <input type="hidden" name="projectId" value={fixedProjectId} />
              ) : (
                mode === "create" && (
                  <div className="crm-field">
                    <label htmlFor="tx-project">Projeto</label>
                    <select id="tx-project" name="projectId" defaultValue="">
                      <option value="">Sem projeto</option>
                      {clientProjects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )
              )}

              {mode === "edit" && transaction && (
                <div className="crm-field">
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>
                    Cliente / Projeto
                  </span>
                  <span>
                    {transaction.clientCompany ?? "—"} / {transaction.projectName ?? "Sem projeto"}
                  </span>
                </div>
              )}

              <div className="crm-field">
                <label htmlFor="tx-description">Descrição *</label>
                <input
                  id="tx-description"
                  name="description"
                  required
                  defaultValue={transaction?.description ?? ""}
                />
              </div>

              <div className="crm-composer-row">
                <div className="crm-field">
                  <label htmlFor="tx-amount">Valor *</label>
                  <input
                    id="tx-amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    defaultValue={transaction?.amount ?? ""}
                  />
                </div>
                <div className="crm-field">
                  <label htmlFor="tx-due">Vencimento</label>
                  <input
                    id="tx-due"
                    name="dueDate"
                    type="date"
                    defaultValue={toDateInputValue(transaction?.dueDate ?? null)}
                  />
                </div>
              </div>

              <div className="crm-composer-row">
                <div className="crm-field">
                  <label htmlFor="tx-category">Categoria {mode === "create" && "*"}</label>
                  <select
                    id="tx-category"
                    name="categoryId"
                    required={mode === "create"}
                    defaultValue={transaction?.categoryId ?? ""}
                  >
                    <option value="">Selecione…</option>
                    {relevantCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="crm-field">
                  <label htmlFor="tx-account">Conta</label>
                  <select
                    id="tx-account"
                    name="accountId"
                    defaultValue={transaction?.accountId ?? ""}
                  >
                    <option value="">Sem conta</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {isDespesa && (
                <div className="crm-composer-row">
                  <div className="crm-field">
                    <label htmlFor="tx-supplier">Fornecedor</label>
                    <input
                      id="tx-supplier"
                      name="supplier"
                      defaultValue={transaction?.supplier ?? ""}
                    />
                  </div>
                  <div className="crm-field">
                    <label htmlFor="tx-cost-center">Centro de custo</label>
                    <input
                      id="tx-cost-center"
                      name="costCenter"
                      defaultValue={transaction?.costCenter ?? ""}
                    />
                  </div>
                </div>
              )}

              {mode === "create" && (
                <div className="crm-field">
                  <label htmlFor="tx-installments">Parcelas</label>
                  <input
                    id="tx-installments"
                    name="installmentsCount"
                    type="number"
                    min="1"
                    max="36"
                    defaultValue={1}
                  />
                </div>
              )}

              {state.status === "error" && <div className="crm-field-error">{state.message}</div>}

              <div className="crm-modal-actions">
                <button type="button" className="btn btn-outline" onClick={close}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-accent">
                  {mode === "create" ? "Criar lançamento" : "Salvar alterações"}
                </button>
              </div>
            </form>
          )}

          {!loading && !error && mode === "edit" && transaction && (
            <div style={{ padding: "0 24px 24px" }}>
              <div className="crm-drawer-section-title" style={{ marginTop: 8 }}>
                Parcelas
              </div>
              <FinancialInstallmentsPanel
                transactionId={transaction.id}
                installments={transaction.installments}
                onChanged={() => {
                  refresh();
                  onSaved();
                }}
              />

              <div className="crm-drawer-section-title" style={{ marginTop: 20 }}>
                Documentos
              </div>
              <FinancialDocumentsPanel
                transactionId={transaction.id}
                documents={transaction.documents}
                onChanged={() => {
                  refresh();
                  onSaved();
                }}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
