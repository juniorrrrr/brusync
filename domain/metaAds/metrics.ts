import type { MetaDerivedMetrics, MetaInsightRaw } from "@/types/metaAds";

/** Deriva CTR/CPM/CPC/CPA/ROAS/ROI a partir dos números brutos sincronizados
 * — nunca persistido (meta_insights guarda só o bruto), nunca recalculado
 * de novo em Analytics/Marketing Intelligence: ambos consomem esta mesma
 * função (ver domain/analytics/metricsCatalog.ts). */
export function deriveMetrics(raw: MetaInsightRaw): MetaDerivedMetrics {
  const ctr = raw.impressions > 0 ? (raw.clicks / raw.impressions) * 100 : null;
  const cpm = raw.impressions > 0 ? (raw.spend / raw.impressions) * 1000 : null;
  const cpc = raw.clicks > 0 ? raw.spend / raw.clicks : null;
  const cpa = raw.conversions > 0 ? raw.spend / raw.conversions : null;
  const roas = raw.spend > 0 ? raw.revenue / raw.spend : null;
  const roi = raw.spend > 0 ? ((raw.revenue - raw.spend) / raw.spend) * 100 : null;

  return { ctr, cpm, cpc, cpa, roas, roi };
}

export function sumInsights(rows: MetaInsightRaw[]): MetaInsightRaw {
  return rows.reduce<MetaInsightRaw>(
    (acc, row) => ({
      date: acc.date,
      impressions: acc.impressions + row.impressions,
      reach: acc.reach + row.reach,
      frequency: null,
      clicks: acc.clicks + row.clicks,
      spend: acc.spend + row.spend,
      conversions: acc.conversions + row.conversions,
      leads: acc.leads + row.leads,
      purchases: acc.purchases + row.purchases,
      revenue: acc.revenue + row.revenue,
    }),
    {
      date: rows[0]?.date ?? "",
      impressions: 0,
      reach: 0,
      frequency: null,
      clicks: 0,
      spend: 0,
      conversions: 0,
      leads: 0,
      purchases: 0,
      revenue: 0,
    },
  );
}
