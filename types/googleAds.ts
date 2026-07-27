export type GoogleAdsConnectionStatus = "conectado" | "desconectado" | "erro";

export interface GoogleAdsAccount {
  id: string;
  customerId: string;
  descriptiveName: string | null;
  currencyCode: string | null;
  timeZone: string | null;
  isManager: boolean;
  isSynced: boolean;
  status: GoogleAdsConnectionStatus;
  lastSyncAt: string | null;
  error: string | null;
  clientId: string | null;
  responsibleId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type GoogleAdsCampaignStatus = "ENABLED" | "PAUSED" | "REMOVED" | "UNKNOWN";

export interface GoogleAdsCampaign {
  id: string;
  accountId: string;
  campaignId: string;
  name: string;
  channelType: string | null;
  status: GoogleAdsCampaignStatus;
  budgetAmount: number | null;
  crmProjectId: string | null;
  crmProjectName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GoogleAdsKeyword {
  id: string;
  campaignId: string;
  keywordId: string;
  adGroupName: string | null;
  text: string;
  matchType: string | null;
  status: string;
  clicks: number;
  impressions: number;
  cost: number;
}

export interface GoogleAdsInsightDaily {
  date: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  conversionsValue: number;
  ctr: number | null;
  cpm: number | null;
  cpa: number | null;
  roas: number | null;
  roi: number | null;
}

export interface GoogleAdsSummary {
  spend: number;
  clicks: number;
  impressions: number;
  conversions: number;
  conversionsValue: number;
  ctr: number | null;
  cpm: number | null;
  cpa: number | null;
  roas: number | null;
  roi: number | null;
  activeCampaigns: number;
}

export interface GoogleAdsDailySpendPoint {
  date: string;
  cost: number;
  conversions: number;
}

export interface GoogleAdsCampaignSummary {
  campaign: GoogleAdsCampaign;
  spend: number;
  clicks: number;
  conversions: number;
}

export interface GoogleAdsDashboardData {
  account: GoogleAdsAccount | null;
  summary: GoogleAdsSummary;
  dailySpend: GoogleAdsDailySpendPoint[];
  topCampaigns: GoogleAdsCampaignSummary[];
  lastSyncAt: string | null;
}

export type GoogleAdsSyncJobType = "accounts" | "campaigns" | "keywords" | "insights" | "full";
