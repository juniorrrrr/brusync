export type GoalType =
  | "receita"
  | "leads"
  | "leads_qualificados"
  | "reunioes"
  | "propostas"
  | "vendas"
  | "conversao"
  | "ticket_medio"
  | "cac"
  | "roi"
  | "roas"
  | "tempo_resposta"
  | "tempo_primeiro_contato"
  | "tempo_fechamento"
  | "projetos_concluidos"
  | "receitas_recebidas"
  | "parcelas_atraso";

export type GoalScopeType =
  | "empresa"
  | "equipe"
  | "usuario"
  | "campanha"
  | "canal"
  | "cidade"
  | "origem"
  | "pipeline"
  | "projeto";

export type GoalPeriodType =
  | "diario"
  | "semanal"
  | "mensal"
  | "trimestral"
  | "semestral"
  | "anual"
  | "personalizado";

export type GoalDirection = "maior_melhor" | "menor_melhor";
export type GoalStatus = "ativa" | "arquivada";

export interface PerformanceGoal {
  id: string;
  type: GoalType;
  scopeType: GoalScopeType;
  scopeRef: string | null;
  periodType: GoalPeriodType;
  periodStart: string;
  periodEnd: string;
  targetValue: number;
  direction: GoalDirection;
  status: GoalStatus;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export type GoalProgressStatus = "superada" | "atingida" | "no_prazo" | "em_risco" | "abaixo_50";

export interface GoalWithProgress extends PerformanceGoal {
  scopeLabel: string;
  /** null quando a métrica não pôde ser calculada para o escopo (ex.: CAC
   * sem investimento lançado no período). */
  actualValue: number | null;
  percentComplete: number | null;
  progressStatus: GoalProgressStatus | null;
}

export interface PerformanceAlertEvidence {
  label: string;
  value: string;
}

export interface PerformanceAlert {
  id: string;
  goalId: string;
  goalType: GoalType;
  title: string;
  description: string;
  severity: "info" | "atencao" | "critico";
  evidence: PerformanceAlertEvidence[];
}

export interface PerformanceRankingRow {
  label: string;
  value: number;
  secondaryLabel: string;
  secondaryValue: number | null;
}

export interface PerformanceRankings {
  topSellers: PerformanceRankingRow[];
  topCampaigns: PerformanceRankingRow[];
  topChannels: PerformanceRankingRow[];
  topTeams: PerformanceRankingRow[];
  topCities: PerformanceRankingRow[];
}

export interface ScorecardHistoryPoint {
  key: string;
  label: string;
  actualValue: number | null;
  targetValue: number | null;
}

export interface Scorecard {
  scopeType: GoalScopeType;
  scopeRef: string | null;
  scopeLabel: string;
  goalsAchieved: number;
  goalsPending: number;
  percentComplete: number | null;
  revenueGenerated: number;
  conversionRate: number | null;
  goals: GoalWithProgress[];
  history: ScorecardHistoryPoint[];
}

export type ComparisonPeriodKey = "hoje" | "ontem" | "semana" | "mes" | "trimestre" | "ano";

export interface ComparisonPoint {
  key: string;
  label: string;
  currentValue: number;
  previousValue: number;
  changePercent: number | null;
  /** Quanto maior melhor (receita, leads) ou quanto menor melhor (tempo,
   * atraso) — decide se um "subiu" é boa ou má notícia, mesmo princípio de
   * domain/intelligence/trends.ts::IntelligenceTrend.favorable. */
  favorableWhenHigher: boolean;
}

export interface PerformanceComparisons {
  period: ComparisonPeriodKey;
  revenue: ComparisonPoint;
  leads: ComparisonPoint;
  conversion: ComparisonPoint;
}

export interface PerformanceExecutiveData {
  companyGoals: GoalWithProgress[];
  overallPercentComplete: number | null;
  rankings: PerformanceRankings;
  alerts: PerformanceAlert[];
  comparisons: PerformanceComparisons;
}

export interface PerformanceCommercialData {
  goals: GoalWithProgress[];
  topSellers: PerformanceRankingRow[];
  alerts: PerformanceAlert[];
}

export interface PerformanceFinancialData {
  goals: GoalWithProgress[];
  alerts: PerformanceAlert[];
}

export interface PerformanceMarketingData {
  goals: GoalWithProgress[];
  topCampaigns: PerformanceRankingRow[];
  topChannels: PerformanceRankingRow[];
  alerts: PerformanceAlert[];
}

export interface PerformanceTeamData {
  scorecards: Scorecard[];
}

export interface PerformanceIndividualData {
  owners: { id: string; name: string | null; email: string | null }[];
  selectedOwnerId: string | null;
  scorecard: Scorecard | null;
}

export interface GoalScopeOption {
  value: string;
  label: string;
}

export interface PerformanceGoalsPageData {
  goals: GoalWithProgress[];
  scopeOptions: Record<GoalScopeType, GoalScopeOption[]>;
}
