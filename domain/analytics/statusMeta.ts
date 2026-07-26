import type {
  AnalyticsDashboardStatus,
  AnalyticsFilterKey,
  AnalyticsWidgetSize,
  AnalyticsWidgetType,
} from "@/types/analytics";

export const WIDGET_TYPE_LABEL: Record<AnalyticsWidgetType, string> = {
  kpi: "KPI",
  linha: "Linha",
  barras: "Barras",
  pizza: "Pizza",
  tabela: "Tabela",
  funil: "Funil",
  area: "Área",
  radar: "Radar",
  heatmap: "Heatmap",
  ranking: "Ranking",
  indicador: "Indicador",
  cards: "Cards",
};

export const WIDGET_TYPES: AnalyticsWidgetType[] = [
  "kpi",
  "indicador",
  "cards",
  "linha",
  "barras",
  "area",
  "pizza",
  "radar",
  "heatmap",
  "funil",
  "ranking",
  "tabela",
];

/** Cada tipo de widget consome uma "forma" de dado — scalar (kpi/indicador/
 * cards), série label→valor (linha/barras/área/pizza/radar/funil/ranking) ou
 * tabela (tabela/heatmap, que usa a série reformatada em matriz). Nenhum tipo
 * tem lógica de cálculo própria — todos leem o mesmo AnalyticsMetricResult. */
export const WIDGET_SHAPE: Record<AnalyticsWidgetType, "scalar" | "series" | "table" | "heatmap"> =
  {
    kpi: "scalar",
    indicador: "scalar",
    cards: "scalar",
    linha: "series",
    barras: "series",
    area: "series",
    pizza: "series",
    radar: "series",
    funil: "series",
    ranking: "series",
    tabela: "table",
    heatmap: "heatmap",
  };

export const WIDGET_SIZE_LABEL: Record<AnalyticsWidgetSize, string> = {
  pequeno: "Pequeno",
  medio: "Médio",
  grande: "Grande",
  largo: "Largo (linha inteira)",
};

export const WIDGET_SIZES: AnalyticsWidgetSize[] = ["pequeno", "medio", "grande", "largo"];

export const DASHBOARD_STATUS_LABEL: Record<AnalyticsDashboardStatus, string> = {
  ativo: "Ativo",
  arquivado: "Arquivado",
};

export const FILTER_KEY_LABEL: Record<AnalyticsFilterKey, string> = {
  periodo: "Período",
  responsavel: "Responsável",
  cliente: "Cliente",
  lead: "Lead",
  projeto: "Projeto",
  origem: "Origem",
  campanha: "Campanha",
  canal: "Canal",
  cidade: "Cidade",
  status: "Status",
  pipeline: "Pipeline",
  equipe: "Equipe",
};

export const FILTER_KEYS: AnalyticsFilterKey[] = [
  "periodo",
  "responsavel",
  "cliente",
  "lead",
  "projeto",
  "origem",
  "campanha",
  "canal",
  "cidade",
  "status",
  "pipeline",
  "equipe",
];

/** Paleta categórica fixa — reaproveita os tokens já existentes em
 * styles/globals.css/crm.css (--accent/--secondary/--warn/--danger/
 * --primary/--ok), nunca cores novas. Ordem fixa (nunca ciclada por
 * filtro), mesmo princípio do skill de dataviz. */
export const ANALYTICS_CHART_COLORS = [
  "var(--accent)",
  "var(--secondary)",
  "var(--warn)",
  "var(--danger)",
  "var(--primary)",
  "var(--ok)",
] as const;
