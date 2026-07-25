import type { FinancialLedgerRow } from "@/domain/financial/calculations";
import type { FinancialMarketingIndicators } from "@/types/financial";
import type { Metric } from "@/types/marketing";
import type { RevenueFinancialKpis } from "@/types/revenueIntelligence";

function isPaidRevenue(row: FinancialLedgerRow): boolean {
  return row.kind === "receita" && row.status === "pago";
}

/** LTV = receita paga acumulada média por cliente, todo o histórico —
 * calculado sobre a população inteira de clientes com receita (não os
 * top-8 do breakdown "revenueByClient" do dashboard financeiro, que trunca
 * para fins de exibição em card). Sem flag de recorrência no schema, este é
 * o LTV honesto disponível: receita real já recebida, não uma projeção. */
export function computeLtv(rows: FinancialLedgerRow[]): number | null {
  const totalsByClient = new Map<string, number>();
  for (const row of rows.filter(isPaidRevenue)) {
    if (!row.clientId) continue;
    totalsByClient.set(row.clientId, (totalsByClient.get(row.clientId) ?? 0) + row.amount);
  }
  if (totalsByClient.size === 0) return null;
  const total = [...totalsByClient.values()].reduce((sum, value) => sum + value, 0);
  return total / totalsByClient.size;
}

/** Payback expresso em "nº de vendas médias para recuperar o CAC" — não em
 * meses: crm_financial_transactions não tem flag de recorrência, então um
 * payback mensal (MRR) seria uma suposição sem dado real por trás. */
export function computePaybackInAverageSales(cac: Metric, averageTicket: number): number | null {
  if (!cac.available || cac.value === null || averageTicket <= 0) return null;
  return cac.value / averageTicket;
}

function toMetric(value: number | null): Metric {
  return { value, available: value !== null };
}

export function buildRevenueFinancialKpis(
  indicators: FinancialMarketingIndicators,
  ltv: number | null,
  averageTicket: number,
  predictedRevenue: number,
  confirmedRevenue: number,
  lostRevenue: number,
  margin: number | null,
): RevenueFinancialKpis {
  const cac = toMetric(indicators.cac);
  return {
    cac,
    roi: toMetric(indicators.roi),
    roas: toMetric(indicators.roas),
    ltv,
    paybackInAverageSales: computePaybackInAverageSales(cac, averageTicket),
    averageTicket,
    predictedRevenue,
    confirmedRevenue,
    lostRevenue,
    margin,
  };
}
