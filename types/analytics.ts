/** Analytics (Fase 27) é uma camada visual — todo valor exibido é resolvido
 * ao vivo por services/analytics/analyticsMetricsService.ts, que só chama
 * camadas de aplicação já existentes (CRM, Marketing, Financeiro, Projetos,
 * Agenda, Comunicação, Equipe, Conversões, Integrações, Performance,
 * Inteligência, IA). As tabelas analytics_* guardam SOMENTE configuração de
 * painel (quais widgets, quais filtros, layout) — nunca um número
 * calculado. */

export type AnalyticsDataSource =
  | "crm"
  | "marketing"
  | "financeiro"
  | "projetos"
  | "agenda"
  | "comunicacao"
  | "equipe"
  | "conversoes"
  | "integracoes"
  | "performance"
  | "inteligencia"
  | "ia"
  | "meta_ads"
  | "google_ads"
  | "ga4"
  | "search_console";

export type AnalyticsMetricKey =
  | "receita"
  | "receita_prevista"
  | "receita_recebida"
  | "ticket_medio"
  | "cac"
  | "roi"
  | "roas"
  | "leads"
  | "clientes"
  | "conversao"
  | "taxa_fechamento"
  | "tempo_fechamento"
  | "projetos_ativos"
  | "projetos_atrasados"
  | "atividades_pendentes"
  | "mensagens"
  | "reunioes"
  | "automacoes_executadas"
  | "eventos_enviados"
  | "saude_integracoes"
  | "performance_equipe"
  | "alertas_inteligencia"
  | "uso_ia"
  | "investimento_meta_ads"
  | "roas_meta_ads"
  | "cpa_meta_ads"
  | "conversoes_meta_ads"
  | "investimento_google_ads"
  | "roas_google_ads"
  | "cpa_google_ads"
  | "conversoes_google_ads"
  | "sessoes_ga4"
  | "usuarios_ga4"
  | "receita_ga4"
  | "conversoes_ga4"
  | "cliques_search_console"
  | "impressoes_search_console"
  | "ctr_search_console"
  | "posicao_search_console";

export type AnalyticsMetricUnit = "moeda" | "numero" | "percentual" | "dias" | "minutos";

export type AnalyticsWidgetType =
  | "kpi"
  | "linha"
  | "barras"
  | "pizza"
  | "tabela"
  | "funil"
  | "area"
  | "radar"
  | "heatmap"
  | "ranking"
  | "indicador"
  | "cards";

export type AnalyticsWidgetSize = "pequeno" | "medio" | "grande" | "largo";

export type AnalyticsPeriodKey =
  | "hoje"
  | "ontem"
  | "ultimos_7_dias"
  | "ultimos_30_dias"
  | "mes_atual"
  | "mes_anterior"
  | "ano_atual"
  | "ano_anterior"
  | "personalizado";

export type AnalyticsFilterKey =
  | "periodo"
  | "responsavel"
  | "cliente"
  | "lead"
  | "projeto"
  | "origem"
  | "campanha"
  | "canal"
  | "cidade"
  | "status"
  | "pipeline"
  | "equipe";

export interface AnalyticsFilterState {
  periodo: AnalyticsPeriodKey;
  periodoInicio: string | null;
  periodoFim: string | null;
  responsavel: string | null;
  cliente: string | null;
  lead: string | null;
  projeto: string | null;
  origem: string | null;
  campanha: string | null;
  canal: string | null;
  cidade: string | null;
  status: string | null;
  pipeline: string | null;
  equipe: string | null;
}

export interface AnalyticsWidgetConfig {
  groupBy?: string;
  topN?: number;
  comparisonEnabled?: boolean;
}

export interface AnalyticsWidget {
  id: string;
  dashboardId: string;
  type: AnalyticsWidgetType;
  dataSource: AnalyticsDataSource;
  metric: AnalyticsMetricKey;
  title: string;
  size: AnalyticsWidgetSize;
  position: number;
  config: AnalyticsWidgetConfig;
  createdAt: string;
  updatedAt: string;
}

export type AnalyticsDashboardStatus = "ativo" | "arquivado";

export interface AnalyticsDashboard {
  id: string;
  name: string;
  description: string | null;
  status: AnalyticsDashboardStatus;
  createdBy: string | null;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsDashboardDetail extends AnalyticsDashboard {
  widgets: AnalyticsWidget[];
  filters: AnalyticsFilterState;
  isFavorite: boolean;
}

export interface AnalyticsShare {
  id: string;
  dashboardId: string;
  shareToken: string;
  createdBy: string | null;
  createdAt: string;
  revokedAt: string | null;
}

export interface AnalyticsSnapshot {
  id: string;
  dashboardId: string;
  label: string;
  state: { widgets: AnalyticsWidget[]; filters: AnalyticsFilterState };
  createdBy: string | null;
  createdByName: string | null;
  createdAt: string;
}

export interface AnalyticsSeriesPoint {
  label: string;
  value: number;
}

export interface AnalyticsHeatmapCell {
  row: string;
  column: string;
  value: number;
}

export interface AnalyticsTableColumn {
  key: string;
  label: string;
}

export interface AnalyticsTableRow {
  [key: string]: string | number;
}

export interface AnalyticsMetricResult {
  metric: AnalyticsMetricKey;
  unit: AnalyticsMetricUnit;
  scalar: number | null;
  comparisonScalar?: number | null;
  changePercent?: number | null;
  series: AnalyticsSeriesPoint[];
  heatmap: AnalyticsHeatmapCell[];
  table: { columns: AnalyticsTableColumn[]; rows: AnalyticsTableRow[] } | null;
}

export interface AnalyticsWidgetData {
  widget: AnalyticsWidget;
  result: AnalyticsMetricResult;
}

export interface AnalyticsDashboardsPageData {
  dashboards: AnalyticsDashboard[];
  favorites: AnalyticsDashboard[];
  recent: AnalyticsDashboard[];
  shared: AnalyticsDashboard[];
  ownerOptions: { id: string; name: string | null; email: string | null }[];
}

export interface AnalyticsMetricCatalogEntry {
  key: AnalyticsMetricKey;
  label: string;
  unit: AnalyticsMetricUnit;
  sources: AnalyticsDataSource[];
}

export interface AnalyticsSearchResult {
  kind: "dashboard" | "widget" | "metric";
  id: string;
  label: string;
  description: string | null;
  href: string | null;
}
