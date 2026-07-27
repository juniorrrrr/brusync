export type Ga4ConnectionStatus = "conectado" | "desconectado" | "erro";

export interface Ga4Property {
  id: string;
  propertyId: string;
  displayName: string | null;
  timeZone: string | null;
  currencyCode: string | null;
  isSynced: boolean;
  status: Ga4ConnectionStatus;
  lastSyncAt: string | null;
  error: string | null;
  clientId: string | null;
  responsibleId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Ga4MetricsDailyPoint {
  date: string;
  sessions: number;
  users: number;
  newUsers: number;
  engagedSessions: number;
  engagementRate: number | null;
  pageViews: number;
  conversions: number;
  revenue: number;
}

export type Ga4DimensionType = "channel" | "device" | "source";

export interface Ga4DimensionBreakdownRow {
  date: string;
  dimensionType: Ga4DimensionType;
  dimensionValue: string;
  sessions: number;
  users: number;
  conversions: number;
}

export interface Ga4Summary {
  sessions: number;
  users: number;
  newUsers: number;
  engagedSessions: number;
  engagementRate: number | null;
  pageViews: number;
  conversions: number;
  revenue: number;
}

export interface Ga4ChannelBreakdown {
  channel: string;
  sessions: number;
  users: number;
  conversions: number;
}

export interface Ga4DeviceBreakdown {
  device: string;
  sessions: number;
  users: number;
}

export interface Ga4DashboardData {
  property: Ga4Property | null;
  summary: Ga4Summary;
  dailyMetrics: Ga4MetricsDailyPoint[];
  topChannels: Ga4ChannelBreakdown[];
  topDevices: Ga4DeviceBreakdown[];
  lastSyncAt: string | null;
}
