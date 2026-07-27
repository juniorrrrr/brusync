import type {
  Ga4ChannelBreakdown,
  Ga4DashboardData,
  Ga4DeviceBreakdown,
  Ga4MetricsDailyPoint,
  Ga4Property,
} from "@/types/ga4";

const now = new Date();
function daysAgoIso(days: number): string {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}
function dateOnly(days: number): string {
  return daysAgoIso(days).slice(0, 10);
}

export const DEMO_GA4_PROPERTY: Ga4Property = {
  id: "00000000-g400-4000-8000-000000000001",
  propertyId: "398765412",
  displayName: "Brusync — Site institucional",
  timeZone: "America/Sao_Paulo",
  currencyCode: "BRL",
  isSynced: true,
  status: "conectado",
  lastSyncAt: daysAgoIso(0),
  error: null,
  clientId: null,
  responsibleId: null,
  createdAt: daysAgoIso(60),
  updatedAt: daysAgoIso(0),
};

const INSIGHT_DAYS = 30;
const BASE_SESSIONS_PER_DAY = 340;

function buildDailyMetrics(): Ga4MetricsDailyPoint[] {
  const rows: Ga4MetricsDailyPoint[] = [];
  for (let dayOffset = INSIGHT_DAYS - 1; dayOffset >= 0; dayOffset -= 1) {
    const wave = 1 + 0.22 * Math.sin(dayOffset / 3.1);
    const sessions = Math.round(BASE_SESSIONS_PER_DAY * wave);
    const users = Math.round(sessions * 0.82);
    const newUsers = Math.round(users * 0.6);
    const engagedSessions = Math.round(sessions * 0.58);
    const pageViews = Math.round(sessions * 2.4);
    const conversions = Math.round(sessions * 0.021);
    const revenue = Math.round(conversions * 420 * 100) / 100;

    rows.push({
      date: dateOnly(dayOffset),
      sessions,
      users,
      newUsers,
      engagedSessions,
      engagementRate: Math.round((engagedSessions / sessions) * 10000) / 100,
      pageViews,
      conversions,
      revenue,
    });
  }
  return rows;
}

const DAILY_METRICS = buildDailyMetrics();

const CHANNEL_SEEDS = [
  { channel: "Organic Search", share: 0.38 },
  { channel: "Direct", share: 0.24 },
  { channel: "Paid Search", share: 0.18 },
  { channel: "Organic Social", share: 0.12 },
  { channel: "Referral", share: 0.08 },
];

const DEVICE_SEEDS = [
  { device: "mobile", share: 0.62 },
  { device: "desktop", share: 0.33 },
  { device: "tablet", share: 0.05 },
];

export function getDemoGa4Property(): Ga4Property {
  return DEMO_GA4_PROPERTY;
}

export function getDemoGa4DashboardData(): Ga4DashboardData {
  const totals = DAILY_METRICS.reduce(
    (acc, row) => ({
      sessions: acc.sessions + row.sessions,
      users: acc.users + row.users,
      newUsers: acc.newUsers + row.newUsers,
      engagedSessions: acc.engagedSessions + row.engagedSessions,
      pageViews: acc.pageViews + row.pageViews,
      conversions: acc.conversions + row.conversions,
      revenue: acc.revenue + row.revenue,
    }),
    {
      sessions: 0,
      users: 0,
      newUsers: 0,
      engagedSessions: 0,
      pageViews: 0,
      conversions: 0,
      revenue: 0,
    },
  );

  const topChannels: Ga4ChannelBreakdown[] = CHANNEL_SEEDS.map((seed) => ({
    channel: seed.channel,
    sessions: Math.round(totals.sessions * seed.share),
    users: Math.round(totals.users * seed.share),
    conversions: Math.round(totals.conversions * seed.share),
  }));

  const topDevices: Ga4DeviceBreakdown[] = DEVICE_SEEDS.map((seed) => ({
    device: seed.device,
    sessions: Math.round(totals.sessions * seed.share),
    users: Math.round(totals.users * seed.share),
  }));

  return {
    property: DEMO_GA4_PROPERTY,
    summary: {
      ...totals,
      engagementRate: Math.round((totals.engagedSessions / totals.sessions) * 10000) / 100,
    },
    dailyMetrics: DAILY_METRICS,
    topChannels,
    topDevices,
    lastSyncAt: DEMO_GA4_PROPERTY.lastSyncAt,
  };
}
