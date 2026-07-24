import type { OperationalDataset } from "@/domain/intelligence/dataset";
import type { IntelligenceScore, IntelligenceScoreFactor } from "@/types/intelligence";

/** Maps a raw value onto a 0–100 score given the range considered
 * "worst" (0) to "best" (100) — the single place every category score
 * normalizes its inputs, so every score in the app is on the same scale
 * by construction. */
function normalize(value: number, worst: number, best: number): number {
  const clamped =
    best > worst ? Math.min(Math.max(value, worst), best) : Math.min(Math.max(value, best), worst);
  const ratio = (clamped - worst) / (best - worst);
  return Math.round(ratio * 100);
}

function factor(
  label: string,
  impact: IntelligenceScoreFactor["impact"],
  detail: string,
): IntelligenceScoreFactor {
  return { label, impact, detail };
}

function weightedAverage(parts: { value: number; weight: number }[]): number {
  const totalWeight = parts.reduce((sum, p) => sum + p.weight, 0);
  if (totalWeight === 0) return 0;
  return Math.round(parts.reduce((sum, p) => sum + p.value * p.weight, 0) / totalWeight);
}

export function computeComercialScore(dataset: OperationalDataset): {
  score: number;
  factors: IntelligenceScoreFactor[];
} {
  const { kpis } = dataset.crm.current;
  const winRateScore = normalize(kpis.winRate, 0, 40);
  const staleScore = normalize(dataset.crm.staleLeads.length, 20, 0);
  const overdueScore = normalize(kpis.overdueLeads, 15, 0);
  const cycleScore =
    kpis.averageTimeToWinDays !== null ? normalize(kpis.averageTimeToWinDays, 60, 15) : 70;

  const factors = [
    factor(
      "Taxa de fechamento",
      kpis.winRate >= 20 ? "positivo" : "negativo",
      `${kpis.winRate.toFixed(1)}% dos leads resolvidos são ganhos`,
    ),
    factor(
      "Leads parados",
      dataset.crm.staleLeads.length <= 5 ? "positivo" : "negativo",
      `${dataset.crm.staleLeads.length} leads sem interação recente`,
    ),
    factor(
      "Leads atrasados",
      kpis.overdueLeads === 0 ? "positivo" : "negativo",
      `${kpis.overdueLeads} leads com tarefa vencida`,
    ),
    factor(
      "Ciclo de venda",
      cycleScore >= 50 ? "positivo" : "negativo",
      kpis.averageTimeToWinDays !== null
        ? `${kpis.averageTimeToWinDays.toFixed(0)} dias em média até o fechamento`
        : "sem dados suficientes",
    ),
  ];

  return {
    score: weightedAverage([
      { value: winRateScore, weight: 3 },
      { value: staleScore, weight: 2 },
      { value: overdueScore, weight: 2 },
      { value: cycleScore, weight: 1 },
    ]),
    factors,
  };
}

export function computeMarketingScore(dataset: OperationalDataset): {
  score: number;
  factors: IntelligenceScoreFactor[];
} {
  const { current } = dataset.marketing;
  const roasScore = current.roas.available ? normalize(current.roas.value ?? 0, 1, 5) : 50;
  const cacTrendScore = 60; // neutral baseline — real movement is captured by the cac_subindo insight, not double counted here
  const conversionScore = normalize(current.conversionRate, 0, 15);

  const factors = [
    factor(
      "ROAS",
      current.roas.available && (current.roas.value ?? 0) >= 3 ? "positivo" : "negativo",
      current.roas.available
        ? `${(current.roas.value ?? 0).toFixed(2)}x de retorno sobre investimento`
        : "sem investimento suficiente no período",
    ),
    factor(
      "Conversão de leads em clientes",
      current.conversionRate >= 5 ? "positivo" : "negativo",
      `${current.conversionRate.toFixed(1)}% dos leads viram clientes`,
    ),
    factor(
      "CAC",
      "neutro",
      current.cac.available
        ? `Custo de aquisição atual: R$ ${(current.cac.value ?? 0).toFixed(0)}`
        : "sem dados suficientes",
    ),
  ];

  return {
    score: weightedAverage([
      { value: roasScore, weight: 3 },
      { value: conversionScore, weight: 2 },
      { value: cacTrendScore, weight: 1 },
    ]),
    factors,
  };
}

export function computeFinanceiroScore(dataset: OperationalDataset): {
  score: number;
  factors: IntelligenceScoreFactor[];
} {
  const { current } = dataset.financial;
  const overdueRatio =
    current.expectedRevenue > 0 ? current.overdueAmount / current.expectedRevenue : 0;
  const overdueScore = normalize(overdueRatio, 0.3, 0);
  const marginScore = current.averageMargin !== null ? normalize(current.averageMargin, 0, 40) : 60;
  const cashFlowScore =
    current.cashFlow >= 0
      ? 80
      : normalize(current.cashFlow, -Math.abs(current.monthExpense || 1), 0);

  const factors = [
    factor(
      "Inadimplência",
      overdueRatio <= 0.1 ? "positivo" : "negativo",
      `${(overdueRatio * 100).toFixed(1)}% da receita esperada está vencida`,
    ),
    factor(
      "Margem média",
      (current.averageMargin ?? 0) >= 20 ? "positivo" : "negativo",
      current.averageMargin !== null
        ? `${current.averageMargin.toFixed(1)}% de margem média`
        : "sem dados suficientes",
    ),
    factor(
      "Fluxo de caixa",
      current.cashFlow >= 0 ? "positivo" : "negativo",
      `R$ ${current.cashFlow.toLocaleString("pt-BR")} no período`,
    ),
  ];

  return {
    score: weightedAverage([
      { value: overdueScore, weight: 3 },
      { value: marginScore, weight: 2 },
      { value: cashFlowScore, weight: 2 },
    ]),
    factors,
  };
}

export function computeOperacionalScore(dataset: OperationalDataset): {
  score: number;
  factors: IntelligenceScoreFactor[];
} {
  const integrationScore =
    dataset.integrations.successRate !== null
      ? normalize(dataset.integrations.successRate, 70, 100)
      : 70;
  const automationScore =
    dataset.automation.successRate !== null
      ? normalize(dataset.automation.successRate, 70, 100)
      : 70;
  const projectsScore = normalize(dataset.projects.overdue.length, 5, 0);

  const factors = [
    factor(
      "Integrações",
      dataset.integrations.errorIntegrations === 0 ? "positivo" : "negativo",
      `${dataset.integrations.errorIntegrations} integrações com erro, ${dataset.integrations.successRate?.toFixed(0) ?? "—"}% de sucesso`,
    ),
    factor(
      "Automações",
      dataset.automation.failuresToday === 0 ? "positivo" : "negativo",
      `${dataset.automation.failuresToday} falhas hoje, ${dataset.automation.successRate?.toFixed(0) ?? "—"}% de sucesso`,
    ),
    factor(
      "Projetos atrasados",
      dataset.projects.overdue.length === 0 ? "positivo" : "negativo",
      `${dataset.projects.overdue.length} projetos com prazo vencido`,
    ),
  ];

  return {
    score: weightedAverage([
      { value: integrationScore, weight: 2 },
      { value: automationScore, weight: 2 },
      { value: projectsScore, weight: 2 },
    ]),
    factors,
  };
}

export function computeAtendimentoScore(dataset: OperationalDataset): {
  score: number;
  factors: IntelligenceScoreFactor[];
} {
  const { averageResponseMinutes } = dataset.communication;
  const responseScore =
    averageResponseMinutes !== null ? normalize(averageResponseMinutes, 240, 15) : 70;

  const factors = [
    factor(
      "Tempo médio de resposta",
      responseScore >= 50 ? "positivo" : "negativo",
      averageResponseMinutes !== null
        ? `${averageResponseMinutes.toFixed(0)} minutos em média`
        : "sem dados suficientes no período",
    ),
  ];

  return { score: responseScore, factors };
}

export interface CategoryScoreInput {
  category: "comercial" | "marketing" | "financeiro" | "operacional" | "atendimento";
  score: number;
  factors: IntelligenceScoreFactor[];
}

function explanationFor(category: string, score: number): string {
  const tier =
    score >= 75
      ? "saudável"
      : score >= 50
        ? "estável, com pontos de atenção"
        : "exigindo atenção imediata";
  return `Score ${category} em ${score}/100 — operação ${tier}.`;
}

/** Runs all five category scorers and derives Geral as their weighted
 * average — comercial and financeiro carry the most weight since they most
 * directly reflect revenue health, matching how the Fase 19 spec frames
 * "Score Geral da Empresa" as a roll-up, not a sixth independent
 * calculation. */
export function computeAllScores(
  dataset: OperationalDataset,
): Record<
  "comercial" | "marketing" | "financeiro" | "operacional" | "atendimento" | "geral",
  IntelligenceScore
> {
  const comercial = computeComercialScore(dataset);
  const marketing = computeMarketingScore(dataset);
  const financeiro = computeFinanceiroScore(dataset);
  const operacional = computeOperacionalScore(dataset);
  const atendimento = computeAtendimentoScore(dataset);

  const geral = weightedAverage([
    { value: comercial.score, weight: 3 },
    { value: financeiro.score, weight: 3 },
    { value: marketing.score, weight: 2 },
    { value: operacional.score, weight: 1 },
    { value: atendimento.score, weight: 1 },
  ]);

  const withHistory = (
    category: string,
    result: { score: number; factors: IntelligenceScoreFactor[] },
  ): IntelligenceScore => ({
    category: category as IntelligenceScore["category"],
    score: result.score,
    explanation: explanationFor(category, result.score),
    factors: result.factors,
    history: dataset.scoreHistory[category] ?? [],
  });

  return {
    comercial: withHistory("comercial", comercial),
    marketing: withHistory("marketing", marketing),
    financeiro: withHistory("financeiro", financeiro),
    operacional: withHistory("operacional", operacional),
    atendimento: withHistory("atendimento", atendimento),
    geral: withHistory("geral", {
      score: geral,
      factors: [
        factor(
          "Comercial",
          comercial.score >= 60 ? "positivo" : "negativo",
          `${comercial.score}/100`,
        ),
        factor(
          "Financeiro",
          financeiro.score >= 60 ? "positivo" : "negativo",
          `${financeiro.score}/100`,
        ),
        factor(
          "Marketing",
          marketing.score >= 60 ? "positivo" : "negativo",
          `${marketing.score}/100`,
        ),
        factor(
          "Operacional",
          operacional.score >= 60 ? "positivo" : "negativo",
          `${operacional.score}/100`,
        ),
        factor(
          "Atendimento",
          atendimento.score >= 60 ? "positivo" : "negativo",
          `${atendimento.score}/100`,
        ),
      ],
    }),
  };
}
