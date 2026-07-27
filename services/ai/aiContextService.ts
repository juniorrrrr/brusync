import "server-only";

import { getClientsPageData } from "@/application/crm/clientsQueries";
import { getDashboardData } from "@/application/crm/dashboardQueries";
import {
  getLeadDetailData,
  getLeadsPageData,
  getPipelineData,
} from "@/application/crm/leadsQueries";
import { getFinancialDashboardPageData } from "@/application/financial/financialDashboardQueries";
import { getFinancialMarketingPageData } from "@/application/financial/financialMarketingQueries";
import { fetchFinancialTransactions } from "@/application/financial/financialTransactionsActions";
import { fetchGa4DashboardData } from "@/application/ga4/ga4Queries";
import { fetchGoogleAdsDashboardData } from "@/application/googleAds/googleAdsQueries";
import { searchKnowledgeAction } from "@/application/knowledge/knowledgeSearchQueries";
import { getCampaignRows } from "@/application/marketingAnalytics/campaignsQueries";
import { fetchMetaAdsDashboardData } from "@/application/metaAds/metaAdsQueries";
import { fetchProjectDetail } from "@/application/projects/projectsActions";
import { getProjectsPageData } from "@/application/projects/projectsQueries";
import { fetchSearchConsoleDashboardData } from "@/application/searchConsole/searchConsoleQueries";
import { fetchTeamDashboardData } from "@/application/team/teamQueries";
import type { ComercialInsightsInput } from "@/domain/ai/insights/comercialInsights";
import type { FinanceiroInsightsInput } from "@/domain/ai/insights/financeiroInsights";
import type { LeadInsightsInput } from "@/domain/ai/insights/leadInsights";
import type { MarketingInsightsInput } from "@/domain/ai/insights/marketingInsights";
import type { ProjetosInsightsInput } from "@/domain/ai/insights/projetosInsights";
import type { AiProviderContext, AiProviderContextFact } from "@/domain/ai/provider";
import type { AiContextType } from "@/types/ai";
import type { FinancialTransaction } from "@/types/financial";
import type { ProjectTask } from "@/types/projects";

/** Único ponto que a IA usa para "enxergar" o resto do sistema — cada
 * função abaixo só chama camadas de aplicação já demo-aware (mesmas usadas
 * pelas telas de CRM/Projetos/Financeiro/Marketing/Performance/Equipe),
 * nunca repositório bruto e nunca uma query nova. Isso é o que a Fase 26
 * chama de "Contexto Inteligente": nenhuma lógica de negócio é duplicada
 * aqui, só combinada. */

export async function buildLeadAssistantContext(leadId: string): Promise<LeadInsightsInput | null> {
  const detail = await getLeadDetailData(leadId);
  if (!detail) return null;
  const { lead } = detail;
  const now = new Date();

  const [dashboard, pipeline, clientsPage, knowledgeMatches] = await Promise.all([
    getDashboardData(),
    getPipelineData(),
    getClientsPageData(),
    searchKnowledgeAction([lead.company, ...lead.tags].filter(Boolean).join(" ") || lead.name),
  ]);

  const stageAvgDays =
    dashboard.stageAvgDuration.find((row) => row.stage.id === lead.stageId)?.avgDays ?? null;

  let daysInStage: number | null = null;
  for (const column of pipeline.columns) {
    const match = column.leads.find((row) => row.id === leadId);
    if (match?.stageEnteredAt) {
      daysInStage = Math.floor(
        (now.getTime() - new Date(match.stageEnteredAt).getTime()) / 86_400_000,
      );
      break;
    }
  }

  const linkedClient = clientsPage.clients.find((c) => c.sourceCrmLeadId === leadId) ?? null;
  const relatedProjects = linkedClient
    ? (await getProjectsPageData({ clientId: linkedClient.id, limit: 20 })).projects
    : [];
  const similarClients = linkedClient
    ? clientsPage.clients
        .filter(
          (c) =>
            c.id !== linkedClient.id && c.ownerId === linkedClient.ownerId && c.ownerId !== null,
        )
        .slice(0, 3)
    : [];

  return {
    lead,
    now,
    stageAvgDays,
    daysInStage,
    materialDownloads: detail.materialDownloads,
    relatedProjects,
    similarClients,
    knowledgeMatches,
  };
}

export async function buildMarketingAssistantContext(): Promise<MarketingInsightsInput> {
  const [{ rows }, financialMarketing, metaAds, googleAds, ga4, searchConsole] = await Promise.all([
    getCampaignRows({ pageSize: 200 }),
    getFinancialMarketingPageData(),
    fetchMetaAdsDashboardData(),
    fetchGoogleAdsDashboardData(),
    fetchGa4DashboardData(),
    fetchSearchConsoleDashboardData(),
  ]);

  return {
    campaigns: rows,
    overallCac: financialMarketing.cac,
    overallRoas: financialMarketing.roas,
    metaAds: metaAds.account ? metaAds : null,
    googleAds: googleAds.account ? googleAds : null,
    ga4: ga4.property ? ga4 : null,
    searchConsole: searchConsole.site ? searchConsole : null,
  };
}

export async function buildComercialAssistantContext(): Promise<ComercialInsightsInput> {
  const now = new Date();
  const [{ leads }, dashboard, pipeline] = await Promise.all([
    getLeadsPageData({ limit: 5000 }),
    getDashboardData(),
    getPipelineData(),
  ]);

  const stageAvgDaysByStageId = new Map(
    dashboard.stageAvgDuration.map((row) => [row.stage.id, row.avgDays]),
  );

  const daysInStageByLeadId = new Map<string, number>();
  for (const column of pipeline.columns) {
    for (const lead of column.leads) {
      if (lead.stageEnteredAt) {
        daysInStageByLeadId.set(
          lead.id,
          Math.floor((now.getTime() - new Date(lead.stageEnteredAt).getTime()) / 86_400_000),
        );
      }
    }
  }

  return { leads, now, stageAvgDaysByStageId, daysInStageByLeadId };
}

async function getReceivableTransactions(): Promise<FinancialTransaction[]> {
  const { transactions } = await fetchFinancialTransactions({ kind: "receita", limit: 5000 });
  return transactions;
}

export async function buildFinanceiroAssistantContext(): Promise<FinanceiroInsightsInput> {
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 86_400_000);

  const [dashboard, receivables] = await Promise.all([
    getFinancialDashboardPageData(),
    getReceivableTransactions(),
  ]);

  const overdueReceivables = receivables.filter((t) => t.status === "vencido");
  const upcomingReceivables = receivables.filter(
    (t) =>
      (t.status === "previsto" || t.status === "parcial") &&
      t.dueDate !== null &&
      new Date(t.dueDate) >= now &&
      new Date(t.dueDate) <= in7Days,
  );

  return { dashboard, overdueReceivables, upcomingReceivables };
}

export async function buildProjetosAssistantContext(): Promise<ProjetosInsightsInput> {
  const now = new Date();
  const [{ projects }, teamDashboard] = await Promise.all([
    getProjectsPageData({ limit: 5000 }),
    fetchTeamDashboardData(),
  ]);

  const overdueProjects = projects
    .filter((p) => p.dueAt !== null && new Date(p.dueAt).getTime() < now.getTime())
    .filter((p) => p.status !== "concluido" && p.status !== "cancelado")
    .slice(0, 8);

  const details = await Promise.all(overdueProjects.map((p) => fetchProjectDetail(p.id)));
  const criticalTasksByProject = new Map<string, ProjectTask[]>();
  details.forEach((detail, index) => {
    if (detail) {
      const tasks = detail.phases.flatMap((phase) => phase.tasks);
      criticalTasksByProject.set(overdueProjects[index].id, tasks);
    }
  });

  return {
    projects,
    now,
    criticalTasksByProject,
    projectsByMember: teamDashboard.projectsByMember,
  };
}

/** Contexto leve para o Chat — resume o módulo escolhido em poucos "fatos"
 * (não a lista completa de insights, que fica nas páginas de assistente
 * dedicadas) e sempre busca a Base de Conhecimento pela pergunta em si, para
 * o provedor simulado poder responder perguntas do tipo "como configurar
 * X?" com documentos reais. */
export async function buildChatContext(
  contextType: AiContextType,
  contextRef: string | null,
  question: string,
): Promise<AiProviderContext> {
  const knowledgeMatches = await searchKnowledgeAction(question);
  const facts: AiProviderContextFact[] = [];
  let label = "Brusync AI";

  if (contextType === "lead" && contextRef) {
    const detail = await getLeadDetailData(contextRef);
    if (detail) {
      const { lead } = detail;
      label = lead.name;
      facts.push(
        { label: "Etapa", value: lead.stage.label },
        { label: "Score", value: String(lead.score) },
        { label: "Responsável", value: lead.owner?.name ?? "—" },
        {
          label: "Última interação",
          value: lead.lastInteractionAt
            ? new Date(lead.lastInteractionAt).toLocaleDateString("pt-BR")
            : "nunca",
        },
      );
    }
  } else if (contextType === "marketing") {
    label = "Marketing";
    const marketing = await buildMarketingAssistantContext();
    facts.push(
      { label: "Campanhas monitoradas", value: String(marketing.campaigns.length) },
      {
        label: "CAC médio",
        value: marketing.overallCac !== null ? String(marketing.overallCac.toFixed(2)) : "—",
      },
      {
        label: "ROAS médio",
        value: marketing.overallRoas !== null ? `${marketing.overallRoas.toFixed(2)}x` : "—",
      },
    );
  } else if (contextType === "comercial") {
    label = "Comercial";
    const comercial = await buildComercialAssistantContext();
    const open = comercial.leads.filter((l) => l.lostAt === null && !l.stage.isWon).length;
    facts.push({ label: "Leads em aberto", value: String(open) });
  } else if (contextType === "financeiro") {
    label = "Financeiro";
    const financeiro = await buildFinanceiroAssistantContext();
    facts.push(
      { label: "Fluxo de caixa do mês", value: String(financeiro.dashboard.cashFlow.toFixed(2)) },
      { label: "Parcelas vencidas", value: String(financeiro.dashboard.overdueCount) },
    );
  } else if (contextType === "projetos") {
    label = "Projetos";
    const projetos = await buildProjetosAssistantContext();
    facts.push({ label: "Projetos ativos", value: String(projetos.projects.length) });
  } else {
    label = "Geral";
    const [leadsPage, projectsPage, financial] = await Promise.all([
      getLeadsPageData({ limit: 1 }),
      getProjectsPageData({ limit: 1 }),
      getFinancialDashboardPageData(),
    ]);
    facts.push(
      { label: "Leads cadastrados", value: String(leadsPage.total) },
      { label: "Projetos cadastrados", value: String(projectsPage.total) },
      { label: "Receita do mês", value: String(financial.monthRevenue.toFixed(2)) },
    );
  }

  return { type: contextType, label, facts, knowledgeMatches };
}
