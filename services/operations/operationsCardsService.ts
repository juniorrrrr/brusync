import "server-only";

import { buildOperationsCards } from "@/domain/operations/cards";
import type { OperationsData } from "@/services/operations/operationsDataService";
import type { OperationsCard, OperationsCardKey } from "@/types/operations";

const NEW_INSIGHT_WINDOW_HOURS = 24;

function distinctInboundClients(data: OperationsData): number {
  const clientIds = new Set(
    data.communication
      .filter((c) => c.lastMessageDirection === "inbound" && c.unreadCount > 0 && c.clientId)
      .map((c) => c.clientId as string),
  );
  return clientIds.size;
}

export function computeOperationsCards(data: OperationsData): OperationsCard[] {
  const now = data.now.getTime();

  const counts: Record<OperationsCardKey, number> = {
    leads_aguardando_contato: data.crm.awaitingContact.length,
    leads_atrasados: data.crm.kpis.overdueLeads,
    followups_vencidos: data.agendaHealth.overdue,
    reunioes_hoje: data.agendaHealth.meetingsToday,
    projetos_atrasados: data.projectsHealth.overdueProjects,
    projetos_proximos_prazo: data.projectsDueSoon.length,
    clientes_aguardando_retorno: distinctInboundClients(data),
    financeiro_vencendo_hoje: data.transactionsDueToday.length,
    parcelas_atraso: data.overdueInstallments.count,
    conversoes_pendentes: data.conversions.pendingDeliveries,
    integracoes_erro: data.integrations.errorIntegrations,
    automacoes_falhando: data.automation.failuresToday,
    mensagens_nao_respondidas: data.communication.filter(
      (c) => c.lastMessageDirection === "inbound" && c.unreadCount > 0,
    ).length,
    alertas_criticos: data.intelligence.criticalAlertsCount,
    insights_novos: data.intelligence.insights.filter(
      (i) => now - new Date(i.createdAt).getTime() <= NEW_INSIGHT_WINDOW_HOURS * 3_600_000,
    ).length,
  };

  return buildOperationsCards(counts);
}
