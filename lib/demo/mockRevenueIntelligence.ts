import { getDemoClientsPageData } from "@/lib/demo/mockCrm";
import type { ClientWithoutContactRow } from "@/types/revenueIntelligence";

/** Único mock genuinamente novo da Fase 22 — todas as outras telas de
 * /receita reaproveitam fixtures que já existem (DEMO_ENRICHED_LEADS em
 * mockMarketing.ts, buildDemoLedgerRows em mockFinancial.ts,
 * getDemoOwnerConversion em mockIntelligence.ts, etc). Esta é a única
 * exceção porque `listClientsWithoutRecentContact` também é a única query
 * genuinamente nova do módulo — sem repositório real equivalente para
 * espelhar em modo demo, referencia os clientes fictícios já existentes por
 * índice, mesmo padrão de lib/demo/mockIntelligence.ts::getDemoDelinquentClients. */
function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export function getDemoClientsWithoutContact(): ClientWithoutContactRow[] {
  const { clients } = getDemoClientsPageData({});
  const plans = [
    { index: 1, daysSinceContact: 35, hadContactBefore: true },
    { index: 3, daysSinceContact: 52, hadContactBefore: false },
  ];

  return plans
    .filter((plan) => clients[plan.index])
    .map((plan) => ({
      clientId: clients[plan.index].id,
      clientCompany: clients[plan.index].company,
      lastMessageAt: plan.hadContactBefore ? daysAgoIso(plan.daysSinceContact) : null,
      daysSinceContact: plan.daysSinceContact,
    }));
}
