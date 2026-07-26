import { type AiSuggestionDraft, formatCurrency } from "@/domain/ai/suggestionDraft";
import type { FinancialDashboardData, FinancialTransaction } from "@/types/financial";

export interface FinanceiroInsightsInput {
  dashboard: FinancialDashboardData;
  overdueReceivables: FinancialTransaction[];
  upcomingReceivables: FinancialTransaction[];
}

/** Assistente Financeiro (Fase 26) — 100% derivado de
 * application/financial/financialDashboardQueries.ts e
 * financialTransactionsActions.ts (já usados pelo módulo Financeiro,
 * Fase 14) — nenhuma métrica nova. */
export function buildFinanceiroInsights(input: FinanceiroInsightsInput): AiSuggestionDraft[] {
  const { dashboard, overdueReceivables, upcomingReceivables } = input;
  const drafts: AiSuggestionDraft[] = [];

  const upcomingTotal = upcomingReceivables.reduce((sum, t) => sum + t.amount, 0);
  drafts.push({
    type: "receita_futura",
    module: "financeiro",
    contextRef: null,
    title: "Receitas futuras",
    content: `${upcomingReceivables.length} recebimento(s) previsto(s) para os próximos dias, totalizando ${formatCurrency(upcomingTotal || dashboard.upcomingAmount)}.`,
    severity: "info",
    evidence: [
      { label: "Receita esperada (total)", value: formatCurrency(dashboard.expectedRevenue) },
    ],
  });

  const byClient = new Map<string, { count: number; amount: number }>();
  for (const t of overdueReceivables) {
    const key = t.clientCompany ?? "Cliente não identificado";
    const current = byClient.get(key) ?? { count: 0, amount: 0 };
    current.count += 1;
    current.amount += t.amount;
    byClient.set(key, current);
  }
  const inadimplentes = [...byClient.entries()]
    .sort((a, b) => b[1].amount - a[1].amount)
    .slice(0, 5);
  drafts.push({
    type: "cliente_inadimplente",
    module: "financeiro",
    contextRef: null,
    title: "Clientes inadimplentes",
    content:
      inadimplentes.length > 0
        ? inadimplentes
            .map(
              ([client, row]) =>
                `• ${client} — ${row.count} parcela(s) vencida(s), ${formatCurrency(row.amount)}`,
            )
            .join("\n")
        : "Nenhum cliente com parcelas vencidas no momento.",
    severity: inadimplentes.length >= 3 ? "critico" : inadimplentes.length > 0 ? "atencao" : "info",
    evidence: [{ label: "Total vencido", value: formatCurrency(dashboard.overdueAmount) }],
  });

  const atRisk = overdueReceivables.filter((t) => t.amount >= dashboard.averageTicket);
  drafts.push({
    type: "receita_em_risco",
    module: "financeiro",
    contextRef: null,
    title: "Receitas em risco",
    content:
      atRisk.length > 0
        ? `${atRisk.length} recebimento(s) vencido(s) acima do ticket médio (${formatCurrency(dashboard.averageTicket)}), somando ${formatCurrency(atRisk.reduce((s, t) => s + t.amount, 0))}.`
        : "Nenhum recebimento vencido de valor relevante identificado.",
    severity: atRisk.length > 0 ? "critico" : "info",
    evidence: [],
  });

  drafts.push({
    type: "fluxo_caixa",
    module: "financeiro",
    contextRef: null,
    title: "Fluxo de caixa",
    content: `Fluxo de caixa do mês: ${formatCurrency(dashboard.cashFlow)} (receita ${formatCurrency(dashboard.monthRevenue)}, despesa ${formatCurrency(dashboard.monthExpense)}).`,
    severity: dashboard.cashFlow < 0 ? "critico" : "info",
    evidence: [
      { label: "Receita do mês", value: formatCurrency(dashboard.monthRevenue) },
      { label: "Despesa do mês", value: formatCurrency(dashboard.monthExpense) },
    ],
  });

  const alerts: string[] = [];
  if (dashboard.overdueCount > 0) {
    alerts.push(
      `${dashboard.overdueCount} parcela(s) vencida(s) somando ${formatCurrency(dashboard.overdueAmount)}`,
    );
  }
  if (dashboard.cashFlow < 0) alerts.push("fluxo de caixa do mês está negativo");
  if (dashboard.averageMargin !== null && dashboard.averageMargin < 15) {
    alerts.push(`margem média baixa (${dashboard.averageMargin.toFixed(1)}%)`);
  }
  drafts.push({
    type: "alerta_financeiro",
    module: "financeiro",
    contextRef: null,
    title: "Alertas financeiros",
    content:
      alerts.length > 0
        ? alerts.map((a) => `• ${a}`).join("\n")
        : "Nenhum alerta financeiro no momento.",
    severity: alerts.length >= 2 ? "critico" : alerts.length > 0 ? "atencao" : "info",
    evidence: [],
  });

  return drafts;
}
