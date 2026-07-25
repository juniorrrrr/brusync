import type { AgendaEvent } from "@/types/agenda";
import type { IntelligenceAlert, IntelligenceInsight } from "@/types/intelligence";

export interface OperationsFinancialSnapshot {
  expectedRevenue: number;
  receivedRevenue: number;
  overdueAmount: number;
  monthRevenue: number;
}

export interface OperationsMarketingSnapshot {
  conversionRate: number;
  roas: number | null;
  cac: number | null;
  leadsCount: number;
}

export interface OperationsProjectsSnapshot {
  active: number;
  completed: number;
  overdue: number;
  dueSoon: number;
}

/** Fase 23 (Performance) — resumo de metas ativas para o Mission Control. */
export interface OperationsPerformanceSnapshot {
  activeGoals: number;
  achievedGoals: number;
  atRiskGoals: number;
  overallPercentComplete: number | null;
}

export type OperationsCardKey =
  | "leads_aguardando_contato"
  | "leads_atrasados"
  | "followups_vencidos"
  | "reunioes_hoje"
  | "projetos_atrasados"
  | "projetos_proximos_prazo"
  | "clientes_aguardando_retorno"
  | "financeiro_vencendo_hoje"
  | "parcelas_atraso"
  | "conversoes_pendentes"
  | "integracoes_erro"
  | "automacoes_falhando"
  | "mensagens_nao_respondidas"
  | "alertas_criticos"
  | "insights_novos";

export type OperationsCardSeverity = "ok" | "info" | "atencao" | "critico";

export interface OperationsCard {
  key: OperationsCardKey;
  label: string;
  value: number;
  severity: OperationsCardSeverity;
  href: string;
}

export type OperationsModuleKey =
  | "crm"
  | "marketing"
  | "financeiro"
  | "projetos"
  | "agenda"
  | "comunicacao"
  | "integracoes"
  | "automacoes"
  | "conhecimento";

export interface OperationsModuleHealth {
  key: OperationsModuleKey;
  label: string;
  status: "ok" | "atencao" | "critico";
  lastUpdatedAt: string | null;
  pendingCount: number;
  href: string;
}

export type OperationsFeedSourceType =
  | "lead"
  | "client"
  | "campaign"
  | "project"
  | "financial"
  | "message"
  | "automation"
  | "meta"
  | "knowledge"
  | "conversion"
  | "agenda";

export interface OperationsFeedItem {
  id: string;
  sourceType: OperationsFeedSourceType;
  sentence: string;
  occurredAt: string;
  href: string | null;
}

export type OperationsQueueItemType =
  | "task"
  | "followup"
  | "call"
  | "meeting"
  | "approval"
  | "project"
  | "client"
  | "lead";

export interface OperationsQueueItem {
  id: string;
  type: OperationsQueueItemType;
  title: string;
  subtitle: string | null;
  dueAt: string | null;
  overdue: boolean;
  href: string;
}

export type OperationsPriority = "alta" | "media" | "baixa";

export interface OperationsNextAction {
  id: string;
  title: string;
  reason: string;
  priority: OperationsPriority;
  href: string;
}

export type OperationsWidgetKey =
  | "kpis"
  | "feed"
  | "agenda"
  | "pendencias"
  | "alertas"
  | "insights"
  | "timeline"
  | "financeiro"
  | "marketing"
  | "projetos"
  | "performance";

export interface OperationsWidgetConfig {
  key: OperationsWidgetKey;
  visible: boolean;
  order: number;
}

export type OperationsFavoriteEntityType =
  | "lead"
  | "client"
  | "project"
  | "document"
  | "dashboard"
  | "integration";

export interface OperationsFavorite {
  id: string;
  entityType: OperationsFavoriteEntityType;
  entityId: string;
  label: string;
  href: string | null;
  createdAt: string;
}

export type OperationsSearchEntityType =
  | "lead"
  | "client"
  | "project"
  | "document"
  | "message"
  | "financial"
  | "agenda"
  | "automation"
  | "integration";

export interface OperationsSearchResult {
  entityType: OperationsSearchEntityType;
  id: string;
  title: string;
  subtitle: string | null;
  href: string;
}

export interface OperationsDashboardData {
  cards: OperationsCard[];
  feed: OperationsFeedItem[];
  timeline: OperationsFeedItem[];
  queue: OperationsQueueItem[];
  nextActions: OperationsNextAction[];
  moduleHealth: OperationsModuleHealth[];
  favorites: OperationsFavorite[];
  criticalAlerts: IntelligenceAlert[];
  newInsights: IntelligenceInsight[];
  agendaToday: AgendaEvent[];
  financialSnapshot: OperationsFinancialSnapshot;
  marketingSnapshot: OperationsMarketingSnapshot;
  projectsSnapshot: OperationsProjectsSnapshot;
  performanceSnapshot: OperationsPerformanceSnapshot;
  layout: OperationsWidgetConfig[];
}
