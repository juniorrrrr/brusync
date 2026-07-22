import "server-only";

import {
  getMarketingDataset,
  type MarketingQueryFilters,
} from "@/application/marketingAnalytics/dataset";
import type { FunnelStageCount, MarketingFunnel } from "@/types/marketing";

/** "Funil de Marketing" starts at Leads, not Visitantes — there's no
 * server-side pageview/session tracking yet (only client-side localStorage
 * and the GA4 pixel, neither of which writes to our database). See Fase 5
 * notes; "Visitantes" will be added once a GA4 (or similar) integration
 * exists to source real visit counts. */
export async function getMarketingFunnel(
  filters: MarketingQueryFilters = {},
): Promise<MarketingFunnel> {
  const { leads } = await getMarketingDataset(filters);

  const qualified = leads.filter((lead) => lead.isQualifiedOrBeyond).length;
  const proposals = leads.filter((lead) => lead.isProposalOrBeyond).length;
  const clients = leads.filter((lead) => lead.clientCreatedAt !== null).length;
  const totalRevenue = leads.reduce((sum, lead) => sum + lead.revenue, 0);

  const rows: { key: string; label: string; count: number }[] = [
    { key: "leads", label: "Leads", count: leads.length },
    { key: "qualificados", label: "Qualificados", count: qualified },
    { key: "propostas", label: "Propostas", count: proposals },
    { key: "clientes", label: "Clientes", count: clients },
  ];

  let previousCount: number | null = null;
  const stages: FunnelStageCount[] = rows.map((row) => {
    const conversionFromPrevious =
      previousCount !== null && previousCount > 0 ? (row.count / previousCount) * 100 : null;
    previousCount = row.count;
    return { ...row, conversionFromPrevious };
  });

  return { stages, totalRevenue };
}
