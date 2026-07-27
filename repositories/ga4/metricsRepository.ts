import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Ga4MetricsDailyPoint, Ga4Summary } from "@/types/ga4";

interface MetricsRow {
  date: string;
  sessions: number;
  users: number;
  new_users: number;
  engaged_sessions: number;
  engagement_rate: number | null;
  page_views: number;
  conversions: number;
  revenue: number;
}

const METRICS_SELECT =
  "date, sessions, users, new_users, engaged_sessions, engagement_rate, page_views, conversions, revenue";

function mapMetrics(row: MetricsRow): Ga4MetricsDailyPoint {
  return {
    date: row.date,
    sessions: row.sessions,
    users: row.users,
    newUsers: row.new_users,
    engagedSessions: row.engaged_sessions,
    engagementRate: row.engagement_rate,
    pageViews: row.page_views,
    conversions: row.conversions,
    revenue: row.revenue,
  };
}

export async function listGa4DailyMetrics(
  supabase: SupabaseClient,
  propertyId: string,
  sinceIso: string,
): Promise<Ga4MetricsDailyPoint[]> {
  const { data, error } = await supabase
    .from("ga4_metrics_daily")
    .select(METRICS_SELECT)
    .eq("property_id", propertyId)
    .gte("date", sinceIso)
    .order("date");
  if (error) throw new Error(`Falha ao carregar métricas do GA4: ${error.message}`);
  return ((data ?? []) as MetricsRow[]).map(mapMetrics);
}

export interface UpsertGa4MetricsRow {
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

export async function upsertGa4DailyMetrics(
  supabase: SupabaseClient,
  propertyId: string,
  rows: UpsertGa4MetricsRow[],
): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await supabase.from("ga4_metrics_daily").upsert(
    rows.map((row) => ({
      property_id: propertyId,
      date: row.date,
      sessions: row.sessions,
      users: row.users,
      new_users: row.newUsers,
      engaged_sessions: row.engagedSessions,
      engagement_rate: row.engagementRate,
      page_views: row.pageViews,
      conversions: row.conversions,
      revenue: row.revenue,
    })),
    { onConflict: "property_id,date" },
  );
  if (error) throw new Error(`Falha ao salvar métricas do GA4: ${error.message}`);
}

export function summarizeGa4Metrics(rows: Ga4MetricsDailyPoint[]): Ga4Summary {
  const totals = rows.reduce(
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

  return {
    ...totals,
    engagementRate: totals.sessions > 0 ? (totals.engagedSessions / totals.sessions) * 100 : null,
  };
}
