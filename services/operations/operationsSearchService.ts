import "server-only";

import { getDemoAgendaEvents } from "@/lib/demo/mockAgenda";
import { getDemoWorkflows } from "@/lib/demo/mockAutomations";
import { getDemoConversations } from "@/lib/demo/mockCommunication";
import { getDemoClientsPageData, getDemoLeadsPageData } from "@/lib/demo/mockCrm";
import { getDemoFinancialTransactions } from "@/lib/demo/mockFinancial";
import { DEMO_INTEGRATIONS } from "@/lib/demo/mockIntegrations";
import { searchDemoKnowledge } from "@/lib/demo/mockKnowledge";
import { getDemoProjects } from "@/lib/demo/mockProjects";
import { listAgendaEvents } from "@/repositories/agenda/agendaEventsRepository";
import { listWorkflows } from "@/repositories/automation/workflowsRepository";
import { listConversations } from "@/repositories/communication/conversationsRepository";
import { listClients } from "@/repositories/crm/clientsRepository";
import { listLeads } from "@/repositories/crm/leadsRepository";
import { listTransactions } from "@/repositories/financial/transactionsRepository";
import { listIntegrations } from "@/repositories/integrations/integrationsRepository";
import { listProjects } from "@/repositories/projects/projectsRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { searchKnowledge } from "@/services/knowledge/knowledgeSearchService";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { OperationsSearchResult } from "@/types/operations";

const RESULTS_PER_CATEGORY = 5;

function containsTerm(value: string | null | undefined, term: string): boolean {
  return !!value && value.toLowerCase().includes(term);
}

/** Every category here calls the SAME search-capable repository/service
 * function each module's own search screen already uses — nothing is
 * queried twice with different logic. Modo Demonstração mirrors that
 * exactly, one demo fixture per category, filtered the same way the real
 * repository filters (ilike-equivalent substring match). */
export async function searchEverything(term: string): Promise<OperationsSearchResult[]> {
  const cleaned = term.trim();
  if (!cleaned) return [];
  const lower = cleaned.toLowerCase();
  const demo = await isDemoModeActive();

  if (demo) {
    const leads = getDemoLeadsPageData({ search: cleaned }).leads.slice(0, RESULTS_PER_CATEGORY);
    const clients = getDemoClientsPageData({ search: cleaned }).clients.slice(
      0,
      RESULTS_PER_CATEGORY,
    );
    const projects = getDemoProjects({ search: cleaned }).projects.slice(0, RESULTS_PER_CATEGORY);
    const conversations = getDemoConversations({ search: cleaned }).slice(0, RESULTS_PER_CATEGORY);
    const agendaEvents = getDemoAgendaEvents({ search: cleaned }).events.slice(
      0,
      RESULTS_PER_CATEGORY,
    );
    const documents = searchDemoKnowledge(cleaned).slice(0, RESULTS_PER_CATEGORY);
    const workflows = getDemoWorkflows()
      .filter((w) => containsTerm(w.name, lower))
      .slice(0, RESULTS_PER_CATEGORY);
    const transactions = getDemoFinancialTransactions()
      .transactions.filter((t) => containsTerm(t.description, lower))
      .slice(0, RESULTS_PER_CATEGORY);
    const integrations = DEMO_INTEGRATIONS.filter(
      (i) => containsTerm(i.name, lower) || containsTerm(i.provider, lower),
    ).slice(0, RESULTS_PER_CATEGORY);

    return [
      ...leads.map(
        (l): OperationsSearchResult => ({
          entityType: "lead",
          id: l.id,
          title: l.name,
          subtitle: l.company,
          href: "/leads",
        }),
      ),
      ...clients.map(
        (c): OperationsSearchResult => ({
          entityType: "client",
          id: c.id,
          title: c.company,
          subtitle: c.email,
          href: "/clientes",
        }),
      ),
      ...projects.map(
        (p): OperationsSearchResult => ({
          entityType: "project",
          id: p.id,
          title: p.name,
          subtitle: p.clientCompany,
          href: "/projetos",
        }),
      ),
      ...conversations.map(
        (c): OperationsSearchResult => ({
          entityType: "message",
          id: c.id,
          title: c.contactName ?? c.crmLeadName ?? c.clientCompany ?? "Conversa",
          subtitle: c.lastMessagePreview,
          href: "/comunicacao",
        }),
      ),
      ...agendaEvents.map(
        (e): OperationsSearchResult => ({
          entityType: "agenda",
          id: e.id,
          title: e.title,
          subtitle: e.leadName,
          href: "/agenda",
        }),
      ),
      ...documents.map(
        (d): OperationsSearchResult => ({
          entityType: "document",
          id: d.id,
          title: d.title,
          subtitle: d.categoryName,
          href: `/base-conhecimento/documentos/${d.id}`,
        }),
      ),
      ...workflows.map(
        (w): OperationsSearchResult => ({
          entityType: "automation",
          id: w.id,
          title: w.name,
          subtitle: w.description,
          href: "/automacoes/lista",
        }),
      ),
      ...transactions.map(
        (t): OperationsSearchResult => ({
          entityType: "financial",
          id: t.id,
          title: t.description,
          subtitle: t.clientCompany,
          href: "/financeiro/lancamentos",
        }),
      ),
      ...integrations.map(
        (i): OperationsSearchResult => ({
          entityType: "integration",
          id: i.provider,
          title: i.name,
          subtitle: i.category,
          href: "/integracoes",
        }),
      ),
    ];
  }

  const supabase = await getSupabaseAuthClient();
  const [
    leadsResult,
    clientsResult,
    projectsResult,
    conversations,
    agendaResult,
    documents,
    workflows,
    transactionsResult,
    integrations,
  ] = await Promise.all([
    listLeads(supabase, { search: cleaned, limit: RESULTS_PER_CATEGORY }),
    listClients(supabase, { search: cleaned }),
    listProjects(supabase, { search: cleaned, limit: RESULTS_PER_CATEGORY }),
    listConversations(supabase, { search: cleaned }),
    listAgendaEvents(supabase, { search: cleaned, limit: RESULTS_PER_CATEGORY }),
    searchKnowledge(supabase, cleaned, RESULTS_PER_CATEGORY),
    listWorkflows(supabase, { search: cleaned }),
    listTransactions(supabase, { search: cleaned, limit: RESULTS_PER_CATEGORY }),
    listIntegrations(supabase, { search: cleaned }),
  ]);

  return [
    ...leadsResult.leads.slice(0, RESULTS_PER_CATEGORY).map(
      (l): OperationsSearchResult => ({
        entityType: "lead",
        id: l.id,
        title: l.name,
        subtitle: l.company,
        href: "/leads",
      }),
    ),
    ...clientsResult.slice(0, RESULTS_PER_CATEGORY).map(
      (c): OperationsSearchResult => ({
        entityType: "client",
        id: c.id,
        title: c.company,
        subtitle: c.email,
        href: "/clientes",
      }),
    ),
    ...projectsResult.projects.slice(0, RESULTS_PER_CATEGORY).map(
      (p): OperationsSearchResult => ({
        entityType: "project",
        id: p.id,
        title: p.name,
        subtitle: p.clientCompany,
        href: "/projetos",
      }),
    ),
    ...conversations.slice(0, RESULTS_PER_CATEGORY).map(
      (c): OperationsSearchResult => ({
        entityType: "message",
        id: c.id,
        title: c.contactName ?? c.crmLeadName ?? c.clientCompany ?? "Conversa",
        subtitle: c.lastMessagePreview,
        href: "/comunicacao",
      }),
    ),
    ...agendaResult.events.slice(0, RESULTS_PER_CATEGORY).map(
      (e): OperationsSearchResult => ({
        entityType: "agenda",
        id: e.id,
        title: e.title,
        subtitle: e.leadName,
        href: "/agenda",
      }),
    ),
    ...documents.slice(0, RESULTS_PER_CATEGORY).map(
      (d): OperationsSearchResult => ({
        entityType: "document",
        id: d.id,
        title: d.title,
        subtitle: d.categoryName,
        href: `/base-conhecimento/documentos/${d.id}`,
      }),
    ),
    ...workflows.slice(0, RESULTS_PER_CATEGORY).map(
      (w): OperationsSearchResult => ({
        entityType: "automation",
        id: w.id,
        title: w.name,
        subtitle: w.description,
        href: "/automacoes/lista",
      }),
    ),
    ...transactionsResult.transactions.slice(0, RESULTS_PER_CATEGORY).map(
      (t): OperationsSearchResult => ({
        entityType: "financial",
        id: t.id,
        title: t.description,
        subtitle: t.clientCompany,
        href: "/financeiro/lancamentos",
      }),
    ),
    ...integrations.slice(0, RESULTS_PER_CATEGORY).map(
      (i): OperationsSearchResult => ({
        entityType: "integration",
        id: i.provider,
        title: i.name,
        subtitle: i.category,
        href: "/integracoes",
      }),
    ),
  ];
}
