/** Category used by insights/alerts/rules — "projetos" is its own bucket
 * here (distinct from the "operacional" bucket used for
 * integrations/automation/storage health). */
export type IntelligenceCategory =
  | "comercial"
  | "marketing"
  | "financeiro"
  | "projetos"
  | "atendimento"
  | "operacional";

/** The six named scores from the spec — "projetos" health rolls into the
 * "operacional" score, it doesn't get its own top-level score bucket. */
export type IntelligenceScoreCategory =
  | "comercial"
  | "marketing"
  | "financeiro"
  | "operacional"
  | "atendimento"
  | "geral";

export type IntelligenceSeverity = "info" | "atencao" | "critico";
export type IntelligenceTrendDirection = "subindo" | "descendo" | "estavel";
export type IntelligenceInsightStatus = "ativo" | "resolvido" | "ignorado";
export type IntelligenceAlertStatus = "ativo" | "reconhecido" | "resolvido";
export type IntelligenceRuleKind = "insight" | "alerta";

export interface IntelligenceEvidenceItem {
  label: string;
  value: string;
  href?: string | null;
}

export interface IntelligenceRule {
  id: string;
  key: string;
  name: string;
  description: string | null;
  category: IntelligenceCategory;
  kind: IntelligenceRuleKind;
  severityDefault: IntelligenceSeverity;
  enabled: boolean;
  config: Record<string, number | string | boolean>;
}

export interface IntelligenceInsight {
  id: string;
  ruleKey: string | null;
  type: string;
  category: IntelligenceCategory;
  severity: IntelligenceSeverity;
  title: string;
  description: string;
  metricValue: number | null;
  metricUnit: string | null;
  trend: IntelligenceTrendDirection | null;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  evidence: IntelligenceEvidenceItem[];
  periodFrom: string | null;
  periodTo: string | null;
  status: IntelligenceInsightStatus;
  createdAt: string;
  updatedAt: string;
}

export interface IntelligenceAlert {
  id: string;
  ruleKey: string | null;
  type: string;
  category: IntelligenceCategory;
  severity: IntelligenceSeverity;
  title: string;
  description: string;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  evidence: IntelligenceEvidenceItem[];
  status: IntelligenceAlertStatus;
  acknowledgedByName: string | null;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IntelligenceScoreFactor {
  label: string;
  impact: "positivo" | "negativo" | "neutro";
  detail: string;
}

export interface IntelligenceScore {
  category: IntelligenceScoreCategory;
  score: number;
  explanation: string;
  factors: IntelligenceScoreFactor[];
  history: { date: string; score: number }[];
}

export interface IntelligenceRecommendation {
  id: string;
  category: IntelligenceCategory;
  title: string;
  reason: string;
  action: string;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  relatedEntityLabel: string | null;
  severity: IntelligenceSeverity;
}

export interface IntelligenceTrend {
  key: string;
  label: string;
  direction: IntelligenceTrendDirection;
  /** Whether this movement is good news — a metric where lower is better
   * (CAC, tempo de resposta) is favorable when it's "descendo", one where
   * higher is better (receita, ROAS) is favorable when "subindo". Decided
   * once, in domain/intelligence/trends.ts, from the metric's own polarity —
   * never inferred from direction alone by the UI. */
  favorable: boolean;
  currentValue: number;
  previousValue: number;
  changePercent: number | null;
  unit: string;
}

export interface IntelligenceFeedItem {
  id: string;
  sentence: string;
  category: IntelligenceCategory;
  severity: IntelligenceSeverity;
  createdAt: string;
  sourceType: "insight" | "alerta";
  sourceId: string;
}

export type IntelligencePeriodKey =
  | "hoje"
  | "ontem"
  | "7d"
  | "30d"
  | "mes_atual"
  | "mes_anterior"
  | "ano"
  | "personalizado";

export interface IntelligenceDateRange {
  from: string;
  to: string;
}

export interface IntelligenceDashboardData {
  insightsCount: number;
  activeAlertsCount: number;
  criticalAlertsCount: number;
  scores: Record<IntelligenceScoreCategory, IntelligenceScore>;
  insights: IntelligenceInsight[];
  alerts: IntelligenceAlert[];
  recommendations: IntelligenceRecommendation[];
  trends: IntelligenceTrend[];
  feed: IntelligenceFeedItem[];
  range: IntelligenceDateRange;
  previousRange: IntelligenceDateRange;
}
