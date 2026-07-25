import "server-only";

import { OPERATIONS_MODULE_HREF, OPERATIONS_MODULE_LABEL } from "@/domain/operations/types";
import type { OperationsData } from "@/services/operations/operationsDataService";
import type { OperationsModuleHealth, OperationsModuleKey } from "@/types/operations";

function statusFromCount(count: number, criticalAt: number): OperationsModuleHealth["status"] {
  if (count >= criticalAt) return "critico";
  if (count > 0) return "atencao";
  return "ok";
}

function statusFromScore(score: number): OperationsModuleHealth["status"] {
  if (score >= 75) return "ok";
  if (score >= 50) return "atencao";
  return "critico";
}

/** One row per module, reusing counts and scores already computed for the
 * rest of the page (projectsHealth, agendaHealth, integrations, automation,
 * and the Fase 19 scores for marketing/financeiro/atendimento) — no module
 * is queried again just to render its health row. */
export function computeOperationsModuleHealth(data: OperationsData): OperationsModuleHealth[] {
  const messagesUnresponded = data.communication.filter(
    (c) => c.lastMessageDirection === "inbound" && c.unreadCount > 0,
  ).length;

  const pendingByModule: Record<OperationsModuleKey, number> = {
    crm: data.crm.kpis.overdueLeads + data.crm.kpis.leadsWithoutActivity,
    marketing: 0,
    financeiro: data.financial.overdueCount,
    projetos: data.projectsHealth.overdueProjects,
    agenda: data.agendaHealth.overdue,
    comunicacao: messagesUnresponded,
    integracoes: data.integrations.errorIntegrations,
    automacoes: data.automation.failuresToday,
    conhecimento: 0,
  };

  const statusByModule: Record<OperationsModuleKey, OperationsModuleHealth["status"]> = {
    crm: statusFromCount(pendingByModule.crm, 10),
    marketing: statusFromScore(data.intelligence.scores.marketing.score),
    financeiro: statusFromScore(data.intelligence.scores.financeiro.score),
    projetos: statusFromCount(pendingByModule.projetos, 3),
    agenda: statusFromCount(pendingByModule.agenda, 5),
    comunicacao: statusFromCount(pendingByModule.comunicacao, 10),
    integracoes: statusFromCount(pendingByModule.integracoes, 1),
    automacoes: statusFromCount(pendingByModule.automacoes, 1),
    conhecimento: "ok",
  };

  const keys: OperationsModuleKey[] = [
    "crm",
    "marketing",
    "financeiro",
    "projetos",
    "agenda",
    "comunicacao",
    "integracoes",
    "automacoes",
    "conhecimento",
  ];

  return keys.map((key) => ({
    key,
    label: OPERATIONS_MODULE_LABEL[key],
    status: statusByModule[key],
    lastUpdatedAt: data.now.toISOString(),
    pendingCount: pendingByModule[key],
    href: OPERATIONS_MODULE_HREF[key],
  }));
}
