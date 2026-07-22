import type { BadgeTone } from "@/types/crm";

export type MarketingOrigin =
  | "google_ads"
  | "meta_ads"
  | "organico"
  | "direto"
  | "indicacao"
  | "linkedin"
  | "tiktok"
  | "outros";

/** Every metric in the module carries this shape: a value plus whether it
 * could actually be computed. `available: false` means the metric has no
 * data to be based on (e.g. ROAS with no spend entered for that scope) —
 * the UI must render "—", never a fabricated zero. */
export interface Metric {
  value: number | null;
  available: boolean;
}

export interface ExecutiveMetrics {
  totalInvestment: Metric;
  totalRevenue: number;
  roas: Metric;
  roi: Metric;
  cac: Metric;
  leadsCount: number;
  qualifiedLeadsCount: number;
  clientsCount: number;
  averageTicket: number | null;
  conversionRate: number;
  averageTimeToWinDays: number | null;
}

export interface OriginMetrics {
  origin: MarketingOrigin;
  label: string;
  leads: number;
  clients: number;
  revenue: number;
  conversionRate: number;
  investment: Metric;
  roas: Metric;
}

export interface CampaignRow {
  key: string;
  utmSource: string | null;
  utmCampaign: string | null;
  origin: MarketingOrigin;
  investment: Metric;
  leads: number;
  qualifiedLeads: number;
  clients: number;
  revenue: number;
  roas: Metric;
  roi: Metric;
  conversionRate: number;
}

export interface CreativeRow {
  key: string;
  utmContent: string | null;
  utmTerm: string | null;
  utmCampaign: string | null;
  leads: number;
  clients: number;
  revenue: number;
  conversionRate: number;
}

export interface LandingPageRow {
  landingPage: string;
  leads: number;
  clients: number;
  revenue: number;
  conversionRate: number;
  averageTimeToConvertDays: number | null;
}

export interface UtmLeadRow {
  crmLeadId: string;
  name: string;
  company: string | null;
  stageLabel: string;
  stageColor: BadgeTone;
  isWon: boolean;
  isLost: boolean;
  createdAt: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
}

export interface UtmFacetCount {
  value: string;
  count: number;
}

export interface UtmFacets {
  utmSource: UtmFacetCount[];
  utmMedium: UtmFacetCount[];
  utmCampaign: UtmFacetCount[];
  utmContent: UtmFacetCount[];
  utmTerm: UtmFacetCount[];
}

export interface FunnelStageCount {
  key: string;
  label: string;
  count: number;
  conversionFromPrevious: number | null;
}

export interface MarketingFunnel {
  stages: FunnelStageCount[];
  totalRevenue: number;
}

export interface CampaignSpendEntry {
  id: string;
  utmSource: string;
  utmCampaign: string;
  periodMonth: string;
  amount: number;
  currency: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type MarketingPeriodPreset = "hoje" | "7d" | "30d" | "90d" | "12m";

/** Lead-level marketing attribution surfaced in the Lead Workspace's
 * "Marketing" tab — a superset of the Fase 3 sidebar card, adding the click
 * IDs and visit timestamps that weren't shown there. */
export interface LeadMarketingProfile {
  hasAttribution: boolean;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  landingPage: string | null;
  referer: string | null;
  firstVisit: string | null;
  lastVisit: string | null;
  gclid: string | null;
  fbclid: string | null;
  msclkid: string | null;
  ttclid: string | null;
  origin: MarketingOrigin;
  materialDownloads: { id: string; materialTitle: string; createdAt: string }[];
}
