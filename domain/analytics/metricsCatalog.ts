import type {
  AnalyticsDataSource,
  AnalyticsMetricCatalogEntry,
  AnalyticsMetricKey,
} from "@/types/analytics";

/** Catálogo estático — só rótulos/unidades/fontes válidas para a UI do
 * construtor de dashboards. NENHUM valor é calculado aqui; quem calcula é
 * services/analytics/analyticsMetricsService.ts, um metric por vez, sempre
 * chamando a camada de aplicação já existente da fonte escolhida. */
export const ANALYTICS_METRICS: Record<AnalyticsMetricKey, AnalyticsMetricCatalogEntry> = {
  receita: { key: "receita", label: "Receita", unit: "moeda", sources: ["financeiro"] },
  receita_prevista: {
    key: "receita_prevista",
    label: "Receita prevista",
    unit: "moeda",
    sources: ["financeiro"],
  },
  receita_recebida: {
    key: "receita_recebida",
    label: "Receita recebida",
    unit: "moeda",
    sources: ["financeiro"],
  },
  ticket_medio: {
    key: "ticket_medio",
    label: "Ticket médio",
    unit: "moeda",
    sources: ["financeiro"],
  },
  cac: { key: "cac", label: "CAC", unit: "moeda", sources: ["marketing"] },
  roi: { key: "roi", label: "ROI", unit: "percentual", sources: ["marketing"] },
  roas: { key: "roas", label: "ROAS", unit: "numero", sources: ["marketing"] },
  leads: { key: "leads", label: "Leads", unit: "numero", sources: ["crm", "marketing"] },
  clientes: { key: "clientes", label: "Clientes", unit: "numero", sources: ["crm"] },
  conversao: {
    key: "conversao",
    label: "Conversão",
    unit: "percentual",
    sources: ["crm", "marketing"],
  },
  taxa_fechamento: {
    key: "taxa_fechamento",
    label: "Taxa de fechamento",
    unit: "percentual",
    sources: ["crm"],
  },
  tempo_fechamento: {
    key: "tempo_fechamento",
    label: "Tempo médio de fechamento",
    unit: "dias",
    sources: ["crm"],
  },
  projetos_ativos: {
    key: "projetos_ativos",
    label: "Projetos ativos",
    unit: "numero",
    sources: ["projetos"],
  },
  projetos_atrasados: {
    key: "projetos_atrasados",
    label: "Projetos atrasados",
    unit: "numero",
    sources: ["projetos"],
  },
  atividades_pendentes: {
    key: "atividades_pendentes",
    label: "Atividades pendentes",
    unit: "numero",
    sources: ["agenda"],
  },
  mensagens: { key: "mensagens", label: "Mensagens", unit: "numero", sources: ["comunicacao"] },
  reunioes: { key: "reunioes", label: "Reuniões", unit: "numero", sources: ["agenda"] },
  automacoes_executadas: {
    key: "automacoes_executadas",
    label: "Automações executadas",
    unit: "numero",
    sources: ["integracoes"],
  },
  eventos_enviados: {
    key: "eventos_enviados",
    label: "Eventos enviados",
    unit: "numero",
    sources: ["conversoes"],
  },
  saude_integracoes: {
    key: "saude_integracoes",
    label: "Saúde das integrações",
    unit: "percentual",
    sources: ["integracoes"],
  },
  performance_equipe: {
    key: "performance_equipe",
    label: "Performance da equipe",
    unit: "percentual",
    sources: ["equipe", "performance"],
  },
  alertas_inteligencia: {
    key: "alertas_inteligencia",
    label: "Alertas ativos",
    unit: "numero",
    sources: ["inteligencia"],
  },
  uso_ia: { key: "uso_ia", label: "Uso da IA", unit: "numero", sources: ["ia"] },
  investimento_meta_ads: {
    key: "investimento_meta_ads",
    label: "Investimento Meta Ads",
    unit: "moeda",
    sources: ["meta_ads"],
  },
  roas_meta_ads: {
    key: "roas_meta_ads",
    label: "ROAS Meta Ads",
    unit: "numero",
    sources: ["meta_ads"],
  },
  cpa_meta_ads: {
    key: "cpa_meta_ads",
    label: "CPA Meta Ads",
    unit: "moeda",
    sources: ["meta_ads"],
  },
  conversoes_meta_ads: {
    key: "conversoes_meta_ads",
    label: "Conversões Meta Ads",
    unit: "numero",
    sources: ["meta_ads"],
  },
};

export const ANALYTICS_METRIC_KEYS = Object.keys(ANALYTICS_METRICS) as AnalyticsMetricKey[];

export const ANALYTICS_SOURCE_LABEL: Record<AnalyticsDataSource, string> = {
  crm: "CRM (Leads, Clientes, Pipeline)",
  marketing: "Marketing Intelligence",
  financeiro: "Financeiro",
  projetos: "Projetos",
  agenda: "Agenda",
  comunicacao: "Comunicação",
  equipe: "Equipe",
  conversoes: "Conversões",
  integracoes: "Integrações",
  performance: "Performance Comercial",
  inteligencia: "Central de Inteligência",
  ia: "IA",
  meta_ads: "Meta Ads",
};

export const ANALYTICS_SOURCES: AnalyticsDataSource[] = Object.keys(
  ANALYTICS_SOURCE_LABEL,
) as AnalyticsDataSource[];

export function metricsForSource(source: AnalyticsDataSource): AnalyticsMetricCatalogEntry[] {
  return ANALYTICS_METRIC_KEYS.map((key) => ANALYTICS_METRICS[key]).filter((entry) =>
    entry.sources.includes(source),
  );
}

export function formatMetricValue(
  value: number,
  unit: AnalyticsMetricCatalogEntry["unit"],
): string {
  switch (unit) {
    case "moeda":
      return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    case "percentual":
      return `${value.toFixed(1)}%`;
    case "dias":
      return `${value.toFixed(1)} dias`;
    case "minutos":
      return `${value.toFixed(0)} min`;
    default:
      return value.toLocaleString("pt-BR");
  }
}
