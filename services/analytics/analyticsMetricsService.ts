import "server-only";

import { getAgendaHealthData } from "@/application/agenda/agendaHealthQueries";
import { fetchAiDashboardData } from "@/application/ai/aiQueries";
import { getAutomationHealthData } from "@/application/automation/automationHealthQueries";
import { getCommunicationInboxPageData } from "@/application/communication/communicationDashboardQueries";
import { getConversionsHealthData } from "@/application/conversions/conversionHealthQueries";
import { getClientsPageData } from "@/application/crm/clientsQueries";
import { getDashboardData } from "@/application/crm/dashboardQueries";
import { getLeadsPageData, getPipelineData } from "@/application/crm/leadsQueries";
import { getFinancialDashboardPageData } from "@/application/financial/financialDashboardQueries";
import { getFinancialMarketingPageData } from "@/application/financial/financialMarketingQueries";
import { getIntegrationHealthData } from "@/application/integrations/integrationHealthQueries";
import { fetchIntelligenceDashboardData } from "@/application/intelligence/intelligenceDashboardQueries";
import { getCampaignRows } from "@/application/marketingAnalytics/campaignsQueries";
import { fetchMetaAdsDashboardData } from "@/application/metaAds/metaAdsQueries";
import { fetchPerformanceExecutiveData } from "@/application/performance/performanceQueries";
import { getProjectsHealthData } from "@/application/projects/projectsHealthQueries";
import { getProjectsPageData } from "@/application/projects/projectsQueries";
import { fetchTeamDashboardData } from "@/application/team/teamQueries";
import { ANALYTICS_METRICS } from "@/domain/analytics/metricsCatalog";
import { resolveAnalyticsPeriod } from "@/domain/analytics/periods";
import type {
  AnalyticsDataSource,
  AnalyticsFilterState,
  AnalyticsMetricKey,
  AnalyticsMetricResult,
  AnalyticsSeriesPoint,
} from "@/types/analytics";
import type { ProjectStatus } from "@/types/projects";

const PROJECT_STATUSES: ProjectStatus[] = [
  "planejamento",
  "em_andamento",
  "pausado",
  "concluido",
  "cancelado",
];

function asProjectStatus(value: string | null): ProjectStatus | undefined {
  return value && (PROJECT_STATUSES as string[]).includes(value)
    ? (value as ProjectStatus)
    : undefined;
}

/** Único ponto que "calcula" alguma coisa em Analytics — e mesmo aqui, na
 * prática, só CHAMA a camada de aplicação de cada módulo já existente e
 * reformata o retorno em {scalar, series} para os widgets. Nenhuma consulta
 * SQL, nenhum recálculo de indicador que já existe em outro serviço. Um
 * `resolve*` por fonte de dado (domain/analytics/metricsCatalog.ts), cada um
 * cobrindo só os poucos métricas que fazem sentido para aquela fonte. */

function series(points: AnalyticsSeriesPoint[]): AnalyticsSeriesPoint[] {
  return points.filter((p) => Number.isFinite(p.value));
}

function empty(metric: AnalyticsMetricKey): AnalyticsMetricResult {
  return {
    metric,
    unit: ANALYTICS_METRICS[metric].unit,
    scalar: null,
    series: [],
    heatmap: [],
    table: null,
  };
}

async function resolveCrm(
  metric: AnalyticsMetricKey,
  filters: AnalyticsFilterState,
): Promise<AnalyticsMetricResult> {
  const result = empty(metric);

  if (metric === "leads") {
    const { total, leads } = await getLeadsPageData({
      ownerId: filters.responsavel ?? undefined,
      city: filters.cidade ?? undefined,
      limit: 5000,
    });
    result.scalar = total;
    const byStage = new Map<string, number>();
    for (const lead of leads)
      byStage.set(lead.stage.label, (byStage.get(lead.stage.label) ?? 0) + 1);
    result.series = series([...byStage.entries()].map(([label, value]) => ({ label, value })));
    return result;
  }

  if (metric === "clientes") {
    const { clients } = await getClientsPageData();
    result.scalar = clients.length;
    const byStatus = new Map<string, number>();
    for (const client of clients)
      byStatus.set(client.status, (byStatus.get(client.status) ?? 0) + 1);
    result.series = series([...byStatus.entries()].map(([label, value]) => ({ label, value })));
    return result;
  }

  if (metric === "conversao" || metric === "taxa_fechamento") {
    const { leads } = await getLeadsPageData({
      ownerId: filters.responsavel ?? undefined,
      limit: 5000,
    });
    const won = leads.filter((l) => l.stage.isWon).length;
    const lost = leads.filter((l) => l.lostAt !== null).length;
    result.scalar =
      metric === "conversao"
        ? leads.length > 0
          ? (won / leads.length) * 100
          : 0
        : won + lost > 0
          ? (won / (won + lost)) * 100
          : 0;
    const { columns } = await getPipelineData();
    result.series = series(
      columns.map((col) => ({ label: col.stage.label, value: col.leads.length })),
    );
    return result;
  }

  if (metric === "tempo_fechamento") {
    const dashboard = await getDashboardData();
    result.scalar = dashboard.kpis.averageTimeToWinDays;
    return result;
  }

  return result;
}

async function resolveMarketing(
  metric: AnalyticsMetricKey,
  filters: AnalyticsFilterState,
): Promise<AnalyticsMetricResult> {
  const result = empty(metric);
  const financialMarketing = await getFinancialMarketingPageData();

  if (metric === "cac" || metric === "roi" || metric === "roas") {
    result.scalar =
      metric === "cac"
        ? financialMarketing.cac
        : metric === "roi"
          ? financialMarketing.roi
          : financialMarketing.roas;
    const { rows } = await getCampaignRows({ pageSize: 100 });
    result.series = series(
      rows
        .filter((row) => (filters.campanha ? row.utmCampaign === filters.campanha : true))
        .filter((row) => (filters.canal ? row.utmSource === filters.canal : true))
        .slice(0, 8)
        .map((row) => ({
          label: row.utmCampaign ?? row.utmSource ?? row.key,
          value:
            metric === "cac"
              ? row.clients > 0 && row.investment.value !== null
                ? row.investment.value / row.clients
                : 0
              : metric === "roi"
                ? (row.roi.value ?? 0)
                : (row.roas.value ?? 0),
        })),
    );
    return result;
  }

  if (metric === "leads") {
    const { leads } = await getLeadsPageData({ limit: 5000 });
    result.scalar = leads.length;
    const byOrigin = new Map<string, number>();
    for (const lead of leads) {
      const key = lead.origin ?? "Sem origem";
      byOrigin.set(key, (byOrigin.get(key) ?? 0) + 1);
    }
    result.series = series([...byOrigin.entries()].map(([label, value]) => ({ label, value })));
    return result;
  }

  if (metric === "conversao") {
    const { rows } = await getCampaignRows({ pageSize: 100 });
    const totalLeads = rows.reduce((sum, r) => sum + r.leads, 0);
    const totalClients = rows.reduce((sum, r) => sum + r.clients, 0);
    result.scalar = totalLeads > 0 ? (totalClients / totalLeads) * 100 : 0;
    result.series = series(
      rows.slice(0, 8).map((row) => ({
        label: row.utmCampaign ?? row.utmSource ?? row.key,
        value: row.conversionRate,
      })),
    );
    return result;
  }

  return result;
}

async function resolveFinanceiro(
  metric: AnalyticsMetricKey,
  filters: AnalyticsFilterState,
): Promise<AnalyticsMetricResult> {
  const result = empty(metric);
  const dashboard = await getFinancialDashboardPageData();

  if (metric === "receita") {
    result.scalar = dashboard.monthRevenue;
    result.series = series(
      dashboard.monthlySeries.map((point) => ({ label: point.label, value: point.revenue })),
    );
    return result;
  }
  if (metric === "receita_prevista") {
    result.scalar = dashboard.expectedRevenue;
    return result;
  }
  if (metric === "receita_recebida") {
    result.scalar = dashboard.receivedRevenue;
    const clienteFilter = filters.cliente?.toLowerCase();
    result.series = series(
      dashboard.revenueByClient
        .filter((row) => !clienteFilter || row.label.toLowerCase().includes(clienteFilter))
        .slice(0, 8)
        .map((row) => ({ label: row.label, value: row.value })),
    );
    return result;
  }
  if (metric === "ticket_medio") {
    result.scalar = dashboard.averageTicket;
    return result;
  }

  return result;
}

async function resolveProjetos(
  metric: AnalyticsMetricKey,
  filters: AnalyticsFilterState,
): Promise<AnalyticsMetricResult> {
  const result = empty(metric);
  const health = await getProjectsHealthData();

  if (metric === "projetos_ativos") {
    result.scalar = health.activeProjects;
    result.series = series(health.byStatus.map((row) => ({ label: row.status, value: row.count })));
    return result;
  }
  if (metric === "projetos_atrasados") {
    result.scalar = health.overdueProjects;
    const { projects } = await getProjectsPageData({
      ownerId: filters.responsavel ?? undefined,
      status: asProjectStatus(filters.status),
      limit: 5000,
    });
    const now = Date.now();
    const clienteFilter = filters.cliente?.toLowerCase();
    const overdue = projects.filter(
      (p) =>
        p.dueAt !== null &&
        new Date(p.dueAt).getTime() < now &&
        p.status !== "concluido" &&
        p.status !== "cancelado" &&
        (!clienteFilter || (p.clientCompany ?? "").toLowerCase().includes(clienteFilter)),
    );
    result.series = series(
      health.byOwner
        .filter((row) => overdue.some((p) => p.ownerId === row.ownerId))
        .map((row) => ({ label: row.ownerName ?? "Sem responsável", value: row.count })),
    );
    return result;
  }

  return result;
}

async function resolveAgenda(metric: AnalyticsMetricKey): Promise<AnalyticsMetricResult> {
  const result = empty(metric);
  const health = await getAgendaHealthData();

  if (metric === "atividades_pendentes") {
    result.scalar = health.pendingFollowUps + health.overdue;
    result.series = series([
      { label: "Hoje", value: health.activitiesToday },
      { label: "Atrasadas", value: health.overdue },
      { label: "Follow-up pendente", value: health.pendingFollowUps },
    ]);
    return result;
  }
  if (metric === "reunioes") {
    result.scalar = health.meetingsToday;
    return result;
  }

  return result;
}

async function resolveComunicacao(metric: AnalyticsMetricKey): Promise<AnalyticsMetricResult> {
  const result = empty(metric);
  if (metric === "mensagens") {
    const data = await getCommunicationInboxPageData({}, null);
    result.scalar = data.conversations.length;
    const byChannel = new Map<string, number>();
    for (const conversation of data.conversations) {
      byChannel.set(conversation.channelType, (byChannel.get(conversation.channelType) ?? 0) + 1);
    }
    result.series = series([...byChannel.entries()].map(([label, value]) => ({ label, value })));
  }
  return result;
}

async function resolveEquipe(metric: AnalyticsMetricKey): Promise<AnalyticsMetricResult> {
  const result = empty(metric);
  if (metric === "performance_equipe") {
    const dashboard = await fetchTeamDashboardData();
    result.scalar = dashboard.indicators.averageProductivity;
    result.series = series(
      dashboard.revenueByMember.slice(0, 8).map((row) => ({ label: row.name, value: row.value })),
    );
  }
  return result;
}

async function resolveConversoes(metric: AnalyticsMetricKey): Promise<AnalyticsMetricResult> {
  const result = empty(metric);
  if (metric === "eventos_enviados") {
    const health = await getConversionsHealthData();
    result.scalar = health.sentDeliveries;
    result.series = series(
      health.byDestination.map((row) => ({ label: row.destination, value: row.count })),
    );
  }
  return result;
}

async function resolveIntegracoes(metric: AnalyticsMetricKey): Promise<AnalyticsMetricResult> {
  const result = empty(metric);
  if (metric === "saude_integracoes") {
    const health = await getIntegrationHealthData();
    const total = health.activeIntegrations + health.offlineIntegrations + health.errorIntegrations;
    result.scalar = total > 0 ? (health.activeIntegrations / total) * 100 : null;
    result.series = series([
      { label: "Ativas", value: health.activeIntegrations },
      { label: "Offline", value: health.offlineIntegrations },
      { label: "Com erro", value: health.errorIntegrations },
    ]);
    return result;
  }
  if (metric === "automacoes_executadas") {
    const health = await getAutomationHealthData();
    result.scalar = health.executionsToday;
    result.series = series([
      { label: "Execuções hoje", value: health.executionsToday },
      { label: "Falhas hoje", value: health.failuresToday },
    ]);
  }
  return result;
}

async function resolvePerformance(metric: AnalyticsMetricKey): Promise<AnalyticsMetricResult> {
  const result = empty(metric);
  if (metric === "performance_equipe") {
    const executive = await fetchPerformanceExecutiveData();
    result.scalar = executive.overallPercentComplete;
    result.series = series(
      executive.rankings.topSellers
        .slice(0, 8)
        .map((row) => ({ label: row.label, value: row.value })),
    );
  }
  return result;
}

async function resolveInteligencia(metric: AnalyticsMetricKey): Promise<AnalyticsMetricResult> {
  const result = empty(metric);
  if (metric === "alertas_inteligencia") {
    const data = await fetchIntelligenceDashboardData();
    result.scalar = data.activeAlertsCount;
    result.series = series([
      { label: "Ativos", value: data.activeAlertsCount },
      { label: "Críticos", value: data.criticalAlertsCount },
      { label: "Insights", value: data.insightsCount },
    ]);
  }
  return result;
}

async function resolveIa(metric: AnalyticsMetricKey): Promise<AnalyticsMetricResult> {
  const result = empty(metric);
  if (metric === "uso_ia") {
    const data = await fetchAiDashboardData();
    result.scalar = data.summary.usageLast30Days;
    result.series = series([
      { label: "Conversas", value: data.summary.totalConversations },
      { label: "Mensagens", value: data.summary.totalMessages },
      { label: "Sugestões", value: data.summary.totalSuggestions },
      { label: "Favoritos", value: data.summary.totalFavorites },
    ]);
  }
  return result;
}

/** Nenhum número é recalculado aqui — apenas reformata o que
 * application/metaAds/metaAdsQueries.ts::fetchMetaAdsDashboardData já
 * resolve (que por sua vez só soma o que services/metaAds/
 * metaAdsSyncService.ts sincronizou e domain/metaAds/metrics.ts derivou),
 * mesmo espírito de resolveMarketing acima. */
async function resolveMetaAds(metric: AnalyticsMetricKey): Promise<AnalyticsMetricResult> {
  const result = empty(metric);
  const data = await fetchMetaAdsDashboardData();

  if (metric === "investimento_meta_ads") {
    result.scalar = data.summary.spend;
    result.series = series(
      data.topCampaigns.map((c) => ({ label: c.campaign.name, value: c.summary.spend })),
    );
  } else if (metric === "roas_meta_ads") {
    result.scalar = data.summary.metrics.roas;
    result.series = series(
      data.topCampaigns.map((c) => ({
        label: c.campaign.name,
        value: c.summary.metrics.roas ?? 0,
      })),
    );
  } else if (metric === "cpa_meta_ads") {
    result.scalar = data.summary.metrics.cpa;
  } else if (metric === "conversoes_meta_ads") {
    result.scalar = data.summary.conversions;
    result.series = series(data.dailySpend.map((p) => ({ label: p.date, value: p.conversions })));
  }

  return result;
}

export async function resolveMetric(
  dataSource: AnalyticsDataSource,
  metric: AnalyticsMetricKey,
  filters: AnalyticsFilterState,
): Promise<AnalyticsMetricResult> {
  switch (dataSource) {
    case "crm":
      return resolveCrm(metric, filters);
    case "marketing":
      return resolveMarketing(metric, filters);
    case "financeiro":
      return resolveFinanceiro(metric, filters);
    case "projetos":
      return resolveProjetos(metric, filters);
    case "agenda":
      return resolveAgenda(metric);
    case "comunicacao":
      return resolveComunicacao(metric);
    case "equipe":
      return resolveEquipe(metric);
    case "conversoes":
      return resolveConversoes(metric);
    case "integracoes":
      return resolveIntegracoes(metric);
    case "performance":
      return resolvePerformance(metric);
    case "inteligencia":
      return resolveInteligencia(metric);
    case "ia":
      return resolveIa(metric);
    case "meta_ads":
      return resolveMetaAds(metric);
    default:
      return empty(metric);
  }
}

/** Resolve o período selecionado (domain/analytics/periods.ts) — hoje só
 * usado para saber se há um comparativo disponível; a maioria dos widgets
 * lê o estado ATUAL de cada módulo (mesma limitação já aceita pela Fase 23
 * para métricas fora do escopo empresa: nem todo dado tem quebra
 * histórica reconstruível por período). */
export function resolvePeriodRange(filters: AnalyticsFilterState) {
  return resolveAnalyticsPeriod(
    filters.periodo,
    new Date(),
    filters.periodoInicio && filters.periodoFim
      ? { from: filters.periodoInicio, to: filters.periodoFim }
      : null,
  );
}
