import type {
  CampaignQueryOptions,
  CampaignQueryResult,
} from "@/application/marketingAnalytics/campaignsQueries";
import type { ExecutiveComparison } from "@/application/marketingAnalytics/comparisonQueries";
import { groupBy } from "@/application/marketingAnalytics/dataset";
import type { TimeSeriesPoint } from "@/application/marketingAnalytics/timeSeriesQueries";
import type { UtmExplorerFilters } from "@/application/marketingAnalytics/utmExplorerQueries";
import { buildCampaignKey, parseCampaignKey } from "@/domain/marketing/campaignKey";
import {
  computeCac,
  computeRoas,
  computeRoi,
  knownMetric,
  UNAVAILABLE_METRIC,
} from "@/domain/marketing/metrics";
import {
  classifyMarketingOrigin,
  MARKETING_ORIGIN_LABEL,
  MARKETING_ORIGINS,
} from "@/domain/marketing/originRules";
import { percentChange } from "@/domain/marketing/period";
import { DEMO_LEADS, DEMO_PIPELINE_STAGES } from "@/lib/demo/mockSeed";
import type { BadgeTone } from "@/types/crm";
import type {
  CampaignRow,
  CreativeRow,
  ExecutiveMetrics,
  LandingPageRow,
  LeadMarketingProfile,
  MarketingFunnel,
  MarketingOrigin,
  MarketingPeriodPreset,
  UtmFacetCount,
  UtmFacets,
  UtmLeadRow,
} from "@/types/marketing";

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

/** Fictitious manual investment entries — deliberately not covering every
 * campaign, mirroring how real usage looks (ROAS/ROI show "—" wherever
 * nobody has logged spend yet). */
const DEMO_SPEND: { source: string; campaign: string; amount: number }[] = [
  { source: "google", campaign: "busca-software-personalizado", amount: 4200 },
  { source: "facebook", campaign: "lancamento-crm-inteligente", amount: 3100 },
  { source: "instagram", campaign: "reels-transformacao-digital", amount: 1800 },
];

interface DemoEnrichedLead {
  id: string;
  name: string;
  company: string;
  stageLabel: string;
  stageColor: BadgeTone;
  isWon: boolean;
  isLost: boolean;
  isQualifiedOrBeyond: boolean;
  isProposalOrBeyond: boolean;
  createdAt: string;
  revenue: number;
  clientCreatedAt: string | null;
  wonEnteredAt: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  landingPage: string | null;
  referer: string | null;
  gclid: string | null;
  fbclid: string | null;
  ttclid: string | null;
  origin: MarketingOrigin;
  campaignKey: string;
  firstVisit: string;
  lastVisit: string;
}

const QUALIFIED_POSITION =
  DEMO_PIPELINE_STAGES.find((s) => s.key === "qualificado")?.position ?? Infinity;
const PROPOSAL_POSITION =
  DEMO_PIPELINE_STAGES.find((s) => s.key === "proposta")?.position ?? Infinity;

const DEMO_ENRICHED_LEADS: DemoEnrichedLead[] = DEMO_LEADS.map((seed) => {
  const stage = DEMO_PIPELINE_STAGES.find((s) => s.key === seed.stageKey);
  if (!stage) throw new Error(`Estágio demo desconhecido: ${seed.stageKey}`);
  const isWon = stage.isWon;
  const utm = seed.utm;

  return {
    id: seed.id,
    name: seed.name,
    company: seed.company,
    stageLabel: stage.label,
    stageColor: stage.color,
    isWon,
    isLost: !!seed.lost,
    isQualifiedOrBeyond: stage.position >= QUALIFIED_POSITION,
    isProposalOrBeyond: stage.position >= PROPOSAL_POSITION,
    createdAt: daysAgoIso(seed.daysAgoCreated),
    revenue: isWon ? seed.potentialValue : 0,
    clientCreatedAt: seed.becameClient ? daysAgoIso(seed.daysInStage) : null,
    wonEnteredAt: isWon ? daysAgoIso(seed.daysInStage) : null,
    utmSource: utm?.source ?? null,
    utmMedium: utm?.medium ?? null,
    utmCampaign: utm?.campaign ?? null,
    utmContent: utm?.content ?? null,
    utmTerm: utm?.term ?? null,
    landingPage: utm?.landingPage ?? null,
    referer: utm?.referer ?? null,
    gclid: utm?.gclid ?? null,
    fbclid: utm?.fbclid ?? null,
    ttclid: utm?.ttclid ?? null,
    origin: classifyMarketingOrigin({
      utmSource: utm?.source ?? null,
      utmMedium: utm?.medium ?? null,
      referer: utm?.referer ?? null,
      gclid: utm?.gclid ?? null,
      fbclid: utm?.fbclid ?? null,
      msclkid: null,
      ttclid: utm?.ttclid ?? null,
      manualOrigin: null,
    }),
    campaignKey: buildCampaignKey({
      utmSource: utm?.source ?? null,
      utmCampaign: utm?.campaign ?? null,
    }),
    firstVisit: daysAgoIso(seed.daysAgoCreated + 3),
    lastVisit: daysAgoIso(seed.lastInteractionDaysAgo ?? seed.daysAgoCreated),
  };
});

export function getDemoExecutiveMetrics(): ExecutiveMetrics {
  const leads = DEMO_ENRICHED_LEADS;
  const totalRevenue = leads.reduce((sum, lead) => sum + lead.revenue, 0);
  const totalInvestment = knownMetric(DEMO_SPEND.reduce((sum, entry) => sum + entry.amount, 0));
  const clients = leads.filter((lead) => lead.clientCreatedAt !== null);
  const wonWithRevenue = leads.filter((lead) => lead.revenue > 0);
  const timeToWinSamples = leads
    .filter((lead) => lead.wonEnteredAt)
    .map(
      (lead) =>
        (new Date(lead.wonEnteredAt as string).getTime() - new Date(lead.createdAt).getTime()) /
        86_400_000,
    );

  return {
    totalInvestment,
    totalRevenue,
    roas: computeRoas(totalRevenue, totalInvestment),
    roi: computeRoi(totalRevenue, totalInvestment),
    cac: computeCac(clients.length, totalInvestment),
    leadsCount: leads.length,
    qualifiedLeadsCount: leads.filter((lead) => lead.isQualifiedOrBeyond).length,
    clientsCount: clients.length,
    averageTicket:
      wonWithRevenue.length > 0
        ? wonWithRevenue.reduce((sum, lead) => sum + lead.revenue, 0) / wonWithRevenue.length
        : null,
    conversionRate: leads.length > 0 ? (clients.length / leads.length) * 100 : 0,
    averageTimeToWinDays:
      timeToWinSamples.length > 0
        ? timeToWinSamples.reduce((sum, days) => sum + days, 0) / timeToWinSamples.length
        : null,
  };
}

/** No real "previous period" exists for fictitious data — shows a plausible
 * ~18% growth trend instead of "Sem comparação" everywhere, which reads as
 * more convincing for a demo than an always-empty comparison. */
export function getDemoExecutiveComparison(preset: MarketingPeriodPreset): ExecutiveComparison {
  const current = getDemoExecutiveMetrics();
  const shrink = (value: number) => Math.round(value * 0.82 * 100) / 100;
  const previous: ExecutiveMetrics = {
    ...current,
    totalRevenue: shrink(current.totalRevenue),
    leadsCount: Math.max(0, Math.round(current.leadsCount * 0.8)),
    clientsCount: Math.max(0, Math.round(current.clientsCount * 0.75)),
    conversionRate: Math.max(0, current.conversionRate * 0.9),
  };

  return {
    preset,
    current,
    previous,
    changes: {
      totalRevenue: percentChange(current.totalRevenue, previous.totalRevenue),
      leadsCount: percentChange(current.leadsCount, previous.leadsCount),
      clientsCount: percentChange(current.clientsCount, previous.clientsCount),
      conversionRate: percentChange(current.conversionRate, previous.conversionRate),
    },
  };
}

export function getDemoMarketingTimeSeries(): TimeSeriesPoint[] {
  const buckets = new Map<string, { leads: number; revenue: number }>();
  for (const lead of DEMO_ENRICHED_LEADS) {
    const key = lead.createdAt.slice(0, 10);
    const bucket = buckets.get(key) ?? { leads: 0, revenue: 0 };
    bucket.leads += 1;
    bucket.revenue += lead.revenue;
    buckets.set(key, bucket);
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, bucket]) => ({ date, leads: bucket.leads, revenue: bucket.revenue }));
}

export function getDemoOriginMetrics() {
  const leadsByOrigin = groupBy(DEMO_ENRICHED_LEADS, (lead) => lead.origin);
  const investmentByOrigin = new Map<MarketingOrigin, number>();
  for (const entry of DEMO_SPEND) {
    const origin = classifyMarketingOrigin({
      utmSource: entry.source,
      utmMedium: null,
      referer: null,
      gclid: null,
      fbclid: null,
      msclkid: null,
      ttclid: null,
      manualOrigin: null,
    });
    investmentByOrigin.set(origin, (investmentByOrigin.get(origin) ?? 0) + entry.amount);
  }

  return MARKETING_ORIGINS.map((origin) => {
    const leads = leadsByOrigin.get(origin) ?? [];
    const clients = leads.filter((lead) => lead.clientCreatedAt !== null);
    const revenue = leads.reduce((sum, lead) => sum + lead.revenue, 0);
    const amount = investmentByOrigin.get(origin);
    const investment = amount !== undefined ? knownMetric(amount) : UNAVAILABLE_METRIC;

    return {
      origin,
      label: MARKETING_ORIGIN_LABEL[origin],
      leads: leads.length,
      clients: clients.length,
      revenue,
      conversionRate: leads.length > 0 ? (clients.length / leads.length) * 100 : 0,
      investment,
      roas: computeRoas(revenue, investment),
    };
  });
}

function sortValue(row: CampaignRow, sortBy: string): number {
  switch (sortBy) {
    case "clients":
      return row.clients;
    case "revenue":
      return row.revenue;
    case "roas":
      return row.roas.value ?? Number.NEGATIVE_INFINITY;
    case "roi":
      return row.roi.value ?? Number.NEGATIVE_INFINITY;
    case "investment":
      return row.investment.value ?? Number.NEGATIVE_INFINITY;
    case "conversionRate":
      return row.conversionRate;
    default:
      return row.leads;
  }
}

export function getDemoCampaignRows(options: CampaignQueryOptions = {}): CampaignQueryResult {
  const { search, sortBy = "leads", sortDir = "desc", page = 1, pageSize = 20 } = options;

  const spendByKey = new Map<string, number>();
  for (const entry of DEMO_SPEND)
    spendByKey.set(`${entry.source}::${entry.campaign}`, entry.amount);

  const leadsByCampaign = groupBy(DEMO_ENRICHED_LEADS, (lead) => lead.campaignKey);

  let rows: CampaignRow[] = [...leadsByCampaign.entries()].map(([key, leads]) => {
    const { utmSource, utmCampaign } = parseCampaignKey(key);
    const clients = leads.filter((lead) => lead.clientCreatedAt !== null);
    const revenue = leads.reduce((sum, lead) => sum + lead.revenue, 0);
    const spend = spendByKey.get(key);
    const investment = spend !== undefined ? knownMetric(spend) : UNAVAILABLE_METRIC;

    return {
      key,
      utmSource,
      utmCampaign,
      origin: leads[0].origin,
      investment,
      leads: leads.length,
      qualifiedLeads: leads.filter((lead) => lead.isQualifiedOrBeyond).length,
      clients: clients.length,
      revenue,
      roas: computeRoas(revenue, investment),
      roi: computeRoi(revenue, investment),
      conversionRate: leads.length > 0 ? (clients.length / leads.length) * 100 : 0,
    };
  });

  const term = search?.trim().toLowerCase();
  if (term) {
    rows = rows.filter(
      (row) =>
        row.utmCampaign?.toLowerCase().includes(term) ||
        row.utmSource?.toLowerCase().includes(term),
    );
  }

  const dir = sortDir === "asc" ? 1 : -1;
  rows.sort((a, b) => (sortValue(a, sortBy) - sortValue(b, sortBy)) * dir);

  const total = rows.length;
  const start = (page - 1) * pageSize;
  return { rows: rows.slice(start, start + pageSize), total };
}

export function getDemoCreativeRows(): CreativeRow[] {
  const withClickId = DEMO_ENRICHED_LEADS.filter(
    (lead) => lead.gclid || lead.fbclid || lead.ttclid,
  );
  const grouped = groupBy(
    withClickId,
    (lead) => `${lead.utmContent ?? ""}::${lead.utmTerm ?? ""}::${lead.utmCampaign ?? ""}`,
  );

  return [...grouped.values()]
    .map((group) => {
      const clients = group.filter((lead) => lead.clientCreatedAt !== null);
      const revenue = group.reduce((sum, lead) => sum + lead.revenue, 0);
      return {
        key: `${group[0].utmContent ?? ""}::${group[0].utmTerm ?? ""}::${group[0].utmCampaign ?? ""}`,
        utmContent: group[0].utmContent,
        utmTerm: group[0].utmTerm,
        utmCampaign: group[0].utmCampaign,
        leads: group.length,
        clients: clients.length,
        revenue,
        conversionRate: group.length > 0 ? (clients.length / group.length) * 100 : 0,
      } satisfies CreativeRow;
    })
    .sort((a, b) => b.leads - a.leads);
}

export function getDemoLandingPageRows(): LandingPageRow[] {
  const withLanding = DEMO_ENRICHED_LEADS.filter(
    (lead): lead is DemoEnrichedLead & { landingPage: string } => Boolean(lead.landingPage),
  );
  const grouped = groupBy(withLanding, (lead) => lead.landingPage);

  return [...grouped.entries()]
    .map(([landingPage, group]) => {
      const clients = group.filter((lead) => lead.clientCreatedAt !== null);
      const revenue = group.reduce((sum, lead) => sum + lead.revenue, 0);
      const timeSamples = clients
        .filter((lead) => lead.wonEnteredAt)
        .map(
          (lead) =>
            (new Date(lead.wonEnteredAt as string).getTime() - new Date(lead.createdAt).getTime()) /
            86_400_000,
        );

      return {
        landingPage,
        leads: group.length,
        clients: clients.length,
        revenue,
        conversionRate: group.length > 0 ? (clients.length / group.length) * 100 : 0,
        averageTimeToConvertDays:
          timeSamples.length > 0
            ? timeSamples.reduce((sum, days) => sum + days, 0) / timeSamples.length
            : null,
      } satisfies LandingPageRow;
    })
    .sort((a, b) => b.leads - a.leads);
}

export function getDemoMarketingFunnel(): MarketingFunnel {
  const leads = DEMO_ENRICHED_LEADS;
  const qualified = leads.filter((lead) => lead.isQualifiedOrBeyond).length;
  const proposals = leads.filter((lead) => lead.isProposalOrBeyond).length;
  const clients = leads.filter((lead) => lead.clientCreatedAt !== null).length;
  const totalRevenue = leads.reduce((sum, lead) => sum + lead.revenue, 0);

  const rows = [
    { key: "leads", label: "Leads", count: leads.length },
    { key: "qualificados", label: "Qualificados", count: qualified },
    { key: "propostas", label: "Propostas", count: proposals },
    { key: "clientes", label: "Clientes", count: clients },
  ];

  let previousCount: number | null = null;
  const stages = rows.map((row) => {
    const conversionFromPrevious =
      previousCount !== null && previousCount > 0 ? (row.count / previousCount) * 100 : null;
    previousCount = row.count;
    return { ...row, conversionFromPrevious };
  });

  return { stages, totalRevenue };
}

function facet(pick: (lead: DemoEnrichedLead) => string | null): UtmFacetCount[] {
  const counts = new Map<string, number>();
  for (const lead of DEMO_ENRICHED_LEADS) {
    const value = pick(lead);
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);
}

export function getDemoUtmFacets(): UtmFacets {
  return {
    utmSource: facet((lead) => lead.utmSource),
    utmMedium: facet((lead) => lead.utmMedium),
    utmCampaign: facet((lead) => lead.utmCampaign),
    utmContent: facet((lead) => lead.utmContent),
    utmTerm: facet((lead) => lead.utmTerm),
  };
}

export function getDemoUtmLeads(filters: UtmExplorerFilters = {}): UtmLeadRow[] {
  return DEMO_ENRICHED_LEADS.filter(
    (lead) =>
      (!filters.utmSource || lead.utmSource === filters.utmSource) &&
      (!filters.utmMedium || lead.utmMedium === filters.utmMedium) &&
      (!filters.utmCampaign || lead.utmCampaign === filters.utmCampaign) &&
      (!filters.utmContent || lead.utmContent === filters.utmContent) &&
      (!filters.utmTerm || lead.utmTerm === filters.utmTerm),
  ).map((lead) => ({
    crmLeadId: lead.id,
    name: lead.name,
    company: lead.company,
    stageLabel: lead.stageLabel,
    stageColor: lead.stageColor,
    isWon: lead.isWon,
    isLost: lead.isLost,
    createdAt: lead.createdAt,
    utmSource: lead.utmSource,
    utmMedium: lead.utmMedium,
    utmCampaign: lead.utmCampaign,
    utmContent: lead.utmContent,
    utmTerm: lead.utmTerm,
  }));
}

export function getDemoLeadMarketingProfile(leadId: string): LeadMarketingProfile | null {
  const lead = DEMO_ENRICHED_LEADS.find((item) => item.id === leadId);
  if (!lead) return null;

  const hasAttribution =
    lead.utmSource !== null || lead.utmMedium !== null || lead.referer !== null;

  return {
    hasAttribution,
    utmSource: lead.utmSource,
    utmMedium: lead.utmMedium,
    utmCampaign: lead.utmCampaign,
    utmContent: lead.utmContent,
    utmTerm: lead.utmTerm,
    landingPage: lead.landingPage,
    referer: lead.referer,
    firstVisit: lead.firstVisit,
    lastVisit: lead.lastVisit,
    gclid: lead.gclid,
    fbclid: lead.fbclid,
    msclkid: null,
    ttclid: lead.ttclid,
    origin: lead.origin,
    materialDownloads: [],
  };
}
