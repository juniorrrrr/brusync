import { DEFAULT_ANALYTICS_FILTERS } from "@/domain/analytics/filters";
import { DEMO_OWNERS } from "@/lib/demo/mockSeed";
import type {
  AnalyticsDashboard,
  AnalyticsDashboardDetail,
  AnalyticsShare,
  AnalyticsSnapshot,
  AnalyticsWidget,
} from "@/types/analytics";

/** Fictitious dataset for "Modo Demonstração" — nunca gravado no Supabase.
 * Só a CONFIGURAÇÃO dos dashboards é fabricada aqui (nome, widgets,
 * filtros); o VALOR de cada widget continua sendo calculado ao vivo por
 * services/analytics/analyticsMetricsService.ts, que só chama camadas de
 * aplicação já demo-aware (CRM, Financeiro, Marketing, Projetos, Equipe...)
 * — por isso os números batem exatamente com os dos outros módulos em
 * Modo Demonstração, sem precisar duplicar nada aqui. */

let seq = 0;
function demoId(prefix: string): string {
  seq += 1;
  return `00000000-an00-4000-8000-${prefix}${String(seq).padStart(9, "0")}`;
}

const now = new Date();
function daysAgo(days: number): string {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

interface DashboardSeed {
  name: string;
  description: string;
  daysAgo: number;
  favorite: boolean;
  widgets: Omit<AnalyticsWidget, "id" | "dashboardId" | "createdAt" | "updatedAt">[];
}

const DASHBOARD_SEEDS: DashboardSeed[] = [
  {
    name: "Visão Executiva",
    description: "Panorama geral da operação — receita, leads, projetos e equipe.",
    daysAgo: 30,
    favorite: true,
    widgets: [
      {
        type: "kpi",
        dataSource: "financeiro",
        metric: "receita",
        title: "Receita do mês",
        size: "pequeno",
        position: 0,
        config: {},
      },
      {
        type: "kpi",
        dataSource: "crm",
        metric: "leads",
        title: "Leads",
        size: "pequeno",
        position: 1,
        config: {},
      },
      {
        type: "kpi",
        dataSource: "crm",
        metric: "conversao",
        title: "Conversão",
        size: "pequeno",
        position: 2,
        config: {},
      },
      {
        type: "kpi",
        dataSource: "projetos",
        metric: "projetos_ativos",
        title: "Projetos ativos",
        size: "pequeno",
        position: 3,
        config: {},
      },
      {
        type: "linha",
        dataSource: "financeiro",
        metric: "receita",
        title: "Receita mensal",
        size: "grande",
        position: 4,
        config: {},
      },
      {
        type: "funil",
        dataSource: "crm",
        metric: "leads",
        title: "Funil de leads",
        size: "medio",
        position: 5,
        config: {},
      },
      {
        type: "ranking",
        dataSource: "equipe",
        metric: "performance_equipe",
        title: "Ranking da equipe",
        size: "medio",
        position: 6,
        config: {},
      },
      {
        type: "indicador",
        dataSource: "integracoes",
        metric: "saude_integracoes",
        title: "Saúde das integrações",
        size: "pequeno",
        position: 7,
        config: {},
      },
    ],
  },
  {
    name: "Comercial",
    description: "Leads, pipeline e conversão do time comercial.",
    daysAgo: 20,
    favorite: false,
    widgets: [
      {
        type: "kpi",
        dataSource: "crm",
        metric: "leads",
        title: "Leads cadastrados",
        size: "pequeno",
        position: 0,
        config: {},
      },
      {
        type: "kpi",
        dataSource: "crm",
        metric: "taxa_fechamento",
        title: "Taxa de fechamento",
        size: "pequeno",
        position: 1,
        config: {},
      },
      {
        type: "kpi",
        dataSource: "crm",
        metric: "tempo_fechamento",
        title: "Tempo médio de fechamento",
        size: "pequeno",
        position: 2,
        config: {},
      },
      {
        type: "barras",
        dataSource: "crm",
        metric: "leads",
        title: "Leads por etapa",
        size: "grande",
        position: 3,
        config: {},
      },
      {
        type: "pizza",
        dataSource: "marketing",
        metric: "leads",
        title: "Leads por origem",
        size: "medio",
        position: 4,
        config: {},
      },
      {
        type: "tabela",
        dataSource: "marketing",
        metric: "conversao",
        title: "Conversão por campanha",
        size: "grande",
        position: 5,
        config: {},
      },
    ],
  },
  {
    name: "Financeiro",
    description: "Receita, ticket médio e eficiência de marketing.",
    daysAgo: 12,
    favorite: true,
    widgets: [
      {
        type: "kpi",
        dataSource: "financeiro",
        metric: "receita_recebida",
        title: "Receita recebida",
        size: "pequeno",
        position: 0,
        config: {},
      },
      {
        type: "kpi",
        dataSource: "financeiro",
        metric: "ticket_medio",
        title: "Ticket médio",
        size: "pequeno",
        position: 1,
        config: {},
      },
      {
        type: "kpi",
        dataSource: "marketing",
        metric: "cac",
        title: "CAC",
        size: "pequeno",
        position: 2,
        config: {},
      },
      {
        type: "kpi",
        dataSource: "marketing",
        metric: "roas",
        title: "ROAS",
        size: "pequeno",
        position: 3,
        config: {},
      },
      {
        type: "area",
        dataSource: "financeiro",
        metric: "receita",
        title: "Receita ao longo do tempo",
        size: "grande",
        position: 4,
        config: {},
      },
      {
        type: "ranking",
        dataSource: "financeiro",
        metric: "receita_recebida",
        title: "Receita por cliente",
        size: "medio",
        position: 5,
        config: {},
      },
    ],
  },
  {
    name: "Equipe & Projetos",
    description: "Carga da equipe, projetos atrasados e atividades pendentes.",
    daysAgo: 5,
    favorite: false,
    widgets: [
      {
        type: "kpi",
        dataSource: "projetos",
        metric: "projetos_atrasados",
        title: "Projetos atrasados",
        size: "pequeno",
        position: 0,
        config: {},
      },
      {
        type: "kpi",
        dataSource: "agenda",
        metric: "atividades_pendentes",
        title: "Atividades pendentes",
        size: "pequeno",
        position: 1,
        config: {},
      },
      {
        type: "kpi",
        dataSource: "agenda",
        metric: "reunioes",
        title: "Reuniões hoje",
        size: "pequeno",
        position: 2,
        config: {},
      },
      {
        type: "radar",
        dataSource: "equipe",
        metric: "performance_equipe",
        title: "Performance por colaborador",
        size: "grande",
        position: 3,
        config: {},
      },
      {
        type: "cards",
        dataSource: "ia",
        metric: "uso_ia",
        title: "Uso da IA",
        size: "medio",
        position: 4,
        config: {},
      },
      {
        type: "heatmap",
        dataSource: "projetos",
        metric: "projetos_atrasados",
        title: "Atrasos por responsável",
        size: "medio",
        position: 5,
        config: {},
      },
    ],
  },
];

const dashboardIds = DASHBOARD_SEEDS.map(() => demoId("dash"));

export const DEMO_ANALYTICS_DASHBOARDS: AnalyticsDashboard[] = DASHBOARD_SEEDS.map(
  (seed, index) => ({
    id: dashboardIds[index],
    name: seed.name,
    description: seed.description,
    status: "ativo",
    createdBy: DEMO_OWNERS[index % DEMO_OWNERS.length].id,
    createdByName: DEMO_OWNERS[index % DEMO_OWNERS.length].name,
    createdAt: daysAgo(seed.daysAgo),
    updatedAt: daysAgo(Math.max(seed.daysAgo - 3, 0)),
  }),
);

const DEMO_ANALYTICS_WIDGETS: Record<string, AnalyticsWidget[]> = Object.fromEntries(
  DASHBOARD_SEEDS.map((seed, index) => [
    dashboardIds[index],
    seed.widgets.map((widget, widgetIndex) => ({
      id: demoId("widget"),
      dashboardId: dashboardIds[index],
      createdAt: daysAgo(seed.daysAgo),
      updatedAt: daysAgo(Math.max(seed.daysAgo - widgetIndex, 0)),
      ...widget,
    })),
  ]),
);

const DEMO_FAVORITE_IDS = new Set<string>();
DASHBOARD_SEEDS.forEach((seed, index) => {
  if (seed.favorite) DEMO_FAVORITE_IDS.add(dashboardIds[index]);
});

export function getDemoAnalyticsDashboards(): AnalyticsDashboard[] {
  return DEMO_ANALYTICS_DASHBOARDS;
}

export function getDemoAnalyticsDashboardDetail(id: string): AnalyticsDashboardDetail | null {
  const dashboard = DEMO_ANALYTICS_DASHBOARDS.find((d) => d.id === id);
  if (!dashboard) return null;
  return {
    ...dashboard,
    widgets: DEMO_ANALYTICS_WIDGETS[id] ?? [],
    filters: DEFAULT_ANALYTICS_FILTERS,
    isFavorite: DEMO_FAVORITE_IDS.has(id),
  };
}

export function getDemoFavoriteAnalyticsDashboards(): AnalyticsDashboard[] {
  return DEMO_ANALYTICS_DASHBOARDS.filter((d) => DEMO_FAVORITE_IDS.has(d.id));
}

export function getDemoAnalyticsShares(dashboardId: string): AnalyticsShare[] {
  if (dashboardId !== dashboardIds[0]) return [];
  return [
    {
      id: demoId("share"),
      dashboardId,
      shareToken: "demo-share-token-0000",
      createdBy: DEMO_OWNERS[0].id,
      createdAt: daysAgo(10),
      revokedAt: null,
    },
  ];
}

export function getDemoAnalyticsShareByToken(token: string): AnalyticsShare | null {
  return (
    getDemoAnalyticsShares(dashboardIds[0]).find((share) => share.shareToken === token) ?? null
  );
}

export function getDemoAnalyticsSnapshots(dashboardId: string): AnalyticsSnapshot[] {
  const widgets = DEMO_ANALYTICS_WIDGETS[dashboardId] ?? [];
  if (widgets.length === 0) return [];
  return [
    {
      id: demoId("snap"),
      dashboardId,
      label: "Início do mês",
      state: { widgets, filters: DEFAULT_ANALYTICS_FILTERS },
      createdBy: DEMO_OWNERS[0].id,
      createdByName: DEMO_OWNERS[0].name,
      createdAt: daysAgo(20),
    },
    {
      id: demoId("snap"),
      dashboardId,
      label: "Semana passada",
      state: { widgets, filters: DEFAULT_ANALYTICS_FILTERS },
      createdBy: DEMO_OWNERS[1].id,
      createdByName: DEMO_OWNERS[1].name,
      createdAt: daysAgo(7),
    },
  ];
}
