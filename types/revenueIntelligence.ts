import type { PipelineStage } from "@/types/crm";
import type { FinancialMonthlyPoint } from "@/types/financial";
import type { IntelligenceAlert } from "@/types/intelligence";
import type { MarketingOrigin, Metric } from "@/types/marketing";

/** Forma mínima de lead enriquecido que os domínios da Fase 22 precisam —
 * tanto `EnrichedLead` (application/marketingAnalytics/dataset.ts, dado
 * real) quanto `DemoEnrichedLead` (lib/demo/mockMarketing.ts, Modo
 * Demonstração) satisfazem esta forma estruturalmente, então os domínios
 * abaixo nunca importam o tipo real do módulo de Marketing diretamente — só
 * o que de fato usam. */
export interface RevenueLeadRow {
  createdAt: string;
  ownerName: string | null;
  city: string | null;
  stageId: string;
  stageLabel: string;
  stagePosition: number;
  potentialValue: number | null;
  clientCreatedAt: string | null;
  wonEnteredAt: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  origin: MarketingOrigin;
}

// ---------------------------------------------------------------------------
// Visão Geral — Pipeline Forecast / Receita Prevista/Confirmada/Perdida
// ---------------------------------------------------------------------------

export interface PipelineForecastStageRow {
  stage: PipelineStage;
  openCount: number;
  openValue: number;
  winProbability: number;
  weightedValue: number;
}

export interface RevenueForecastSummary {
  predictedRevenue: number;
  confirmedRevenue: number;
  lostRevenue: number;
  byStage: PipelineForecastStageRow[];
}

/** Cada ponto usa a mesma estimativa de fechamento (criação do lead + ciclo
 * médio de vendas real, `averageTimeToWinDays`) para posicionar o valor
 * ponderado do pipeline aberto no mês/trimestre/ano em que deve fechar —
 * nenhuma data de fechamento é inventada, só extrapolada do ciclo histórico. */
export interface RevenueForecastPoint {
  key: string;
  label: string;
  forecastValue: number;
}

export interface RevenueForecastData {
  summary: RevenueForecastSummary;
  monthly: RevenueForecastPoint[];
  quarterly: RevenueForecastPoint[];
  annual: RevenueForecastPoint[];
  averageSalesCycleDays: number | null;
}

// ---------------------------------------------------------------------------
// Análises Comerciais — conversão por dimensão + tempo médio por etapa
// ---------------------------------------------------------------------------

export type ConversionDimension =
  | "vendedor"
  | "campanha"
  | "origem"
  | "cidade"
  | "canal"
  | "periodo";

export interface ConversionBreakdownRow {
  label: string;
  leads: number;
  clients: number;
  conversionRate: number;
}

export interface StageCycleTimeRow {
  stageLabel: string;
  avgDays: number | null;
  conversionFromPrevious: number | null;
}

export interface ConversionAnalysisData {
  byDimension: Record<ConversionDimension, ConversionBreakdownRow[]>;
  stageCycle: StageCycleTimeRow[];
  averageProjectDeliveryDays: number | null;
}

// ---------------------------------------------------------------------------
// Análise Financeira — CAC/ROI/ROAS/LTV/Payback/Ticket/Margem
// ---------------------------------------------------------------------------

export interface RevenueFinancialKpis {
  cac: Metric;
  roi: Metric;
  roas: Metric;
  /** Receita paga acumulada média por cliente (todo o histórico). */
  ltv: number | null;
  /** CAC ÷ ticket médio — quantas vendas médias são necessárias para
   * recuperar o custo de aquisição. Rotulado na UI como "em nº de vendas
   * médias" para não sugerir uma cadência mensal que o schema não suporta
   * (sem flag de recorrência em crm_financial_transactions). */
  paybackInAverageSales: number | null;
  averageTicket: number;
  predictedRevenue: number;
  confirmedRevenue: number;
  lostRevenue: number;
  margin: number | null;
}

export interface RevenueFinancialData {
  kpis: RevenueFinancialKpis;
  monthlySeries: FinancialMonthlyPoint[];
}

// ---------------------------------------------------------------------------
// Rankings
// ---------------------------------------------------------------------------

export interface RankingRow {
  label: string;
  revenue: number;
  secondaryLabel: string;
  secondaryValue: number | null;
}

export interface RevenueRankings {
  topSellers: RankingRow[];
  topCampaigns: RankingRow[];
  topChannels: RankingRow[];
  topCities: RankingRow[];
  topClients: RankingRow[];
  topSources: RankingRow[];
}

// ---------------------------------------------------------------------------
// Heatmaps
// ---------------------------------------------------------------------------

export interface HeatmapCell {
  rowIndex: number;
  colIndex: number;
  value: number;
}

export interface HeatmapGrid {
  title: string;
  rowLabels: string[];
  colLabels: string[];
  cells: HeatmapCell[];
  maxValue: number;
}

export interface RevenueHeatmapsData {
  /** "Mapa de horários" + "Mapa de dias" combinados num único heatmap
   * dia-da-semana × hora — a leitura padrão de mercado para essa dupla de
   * dimensões, em vez de duas tiras 1D redundantes. */
  hourWeekday: HeatmapGrid;
  month: HeatmapGrid;
  /** "Mapa de origem" cruzado com "Mapa de pipeline" (etapa). */
  originStage: HeatmapGrid;
  /** "Mapa de cidade" cruzado com "Mapa de pipeline" (etapa). */
  cityStage: HeatmapGrid;
}

// ---------------------------------------------------------------------------
// Detecção automática & Insights
// ---------------------------------------------------------------------------

export interface ClientWithoutContactRow {
  clientId: string;
  clientCompany: string;
  lastMessageAt: string | null;
  daysSinceContact: number;
}

export interface ConversionOutlierRow {
  dimension: "vendedor" | "campanha";
  label: string;
  conversionRate: number;
  averageConversionRate: number;
  deviationPercent: number;
  direction: "acima" | "abaixo";
}

export interface RevenueInsightEvidence {
  label: string;
  value: string;
}

export interface RevenueInsight {
  id: string;
  title: string;
  description: string;
  category: "comercial" | "marketing" | "financeiro";
  polarity: "positivo" | "negativo" | "neutro";
  evidence: RevenueInsightEvidence[];
}

export interface RevenueAlertsData {
  reusedAlerts: IntelligenceAlert[];
  clientsWithoutContact: ClientWithoutContactRow[];
  conversionOutliers: ConversionOutlierRow[];
  insights: RevenueInsight[];
}
