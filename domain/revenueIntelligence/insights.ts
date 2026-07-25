import type { IntelligenceTrend } from "@/types/intelligence";
import type { CampaignRow } from "@/types/marketing";
import type {
  ConversionBreakdownRow,
  ConversionOutlierRow,
  RevenueInsight,
  RevenueLeadRow,
} from "@/types/revenueIntelligence";

const MIN_SAMPLE = 5;

function pct(value: number): string {
  return `${value.toFixed(1)}%`;
}

/** "Campanha X possui ROI Y% acima da média das demais" — compara a
 * campanha com melhor ROI (dado real de getCampaignRows, já existente) contra
 * a média das demais campanhas com ROI disponível. */
export function insightBestCampaignRoi(rows: CampaignRow[]): RevenueInsight | null {
  const withRoi = rows.filter(
    (row) => row.roi.available && row.roi.value !== null && row.leads >= MIN_SAMPLE,
  );
  if (withRoi.length < 2) return null;

  const sorted = [...withRoi].sort((a, b) => (b.roi.value ?? 0) - (a.roi.value ?? 0));
  const best = sorted[0];
  const others = sorted.slice(1);
  const othersAvg = others.reduce((sum, row) => sum + (row.roi.value ?? 0), 0) / others.length;
  if (othersAvg <= 0 || best.roi.value === null) return null;

  const deviation = ((best.roi.value - othersAvg) / Math.abs(othersAvg)) * 100;
  if (deviation < 15) return null;

  const label = best.utmCampaign ?? best.utmSource ?? "Sem campanha";
  return {
    id: `campanha-roi-${best.key}`,
    title: `Campanha ${label} com ROI acima da média`,
    description: `A campanha "${label}" tem ROI ${pct(deviation)} acima da média das demais campanhas.`,
    category: "marketing",
    polarity: "positivo",
    evidence: [
      { label: "ROI da campanha", value: pct(best.roi.value) },
      { label: "ROI médio das demais", value: pct(othersAvg) },
      { label: "Leads na campanha", value: String(best.leads) },
    ],
  };
}

/** "Origem/canal X converte Y% acima da média" — mesma comparação, aplicada
 * a qualquer breakdown de conversão já calculado (canal, origem, cidade). */
export function insightBestConvertingDimension(
  rows: ConversionBreakdownRow[],
  dimensionLabel: string,
): RevenueInsight | null {
  const withSample = rows.filter((row) => row.leads >= MIN_SAMPLE);
  if (withSample.length < 2) return null;

  const sorted = [...withSample].sort((a, b) => b.conversionRate - a.conversionRate);
  const best = sorted[0];
  const others = sorted.slice(1);
  const othersAvg = others.reduce((sum, row) => sum + row.conversionRate, 0) / others.length;
  if (othersAvg <= 0) return null;

  const deviation = ((best.conversionRate - othersAvg) / othersAvg) * 100;
  if (deviation < 15) return null;

  return {
    id: `conversao-${dimensionLabel}-${best.label}`,
    title: `${best.label} converte acima da média`,
    description: `${dimensionLabel} "${best.label}" converte ${pct(deviation)} acima da média das demais.`,
    category: "comercial",
    polarity: "positivo",
    evidence: [
      { label: "Taxa de conversão", value: pct(best.conversionRate) },
      { label: "Média das demais", value: pct(othersAvg) },
      { label: "Leads", value: String(best.leads) },
    ],
  };
}

/** "Vendedor X fecha propostas Y% mais rápido que a média" — tempo médio de
 * criação até virar cliente, por vendedor, usando o mesmo dataset de
 * marketing já carregado para as demais análises. */
export function insightFastestSeller(leads: RevenueLeadRow[]): RevenueInsight | null {
  const won = leads.filter((lead) => lead.wonEnteredAt && lead.ownerName);
  const daysByOwner = new Map<string, number[]>();
  for (const lead of won) {
    const days =
      (new Date(lead.wonEnteredAt as string).getTime() - new Date(lead.createdAt).getTime()) /
      86_400_000;
    if (days < 0) continue;
    const key = lead.ownerName as string;
    const list = daysByOwner.get(key) ?? [];
    list.push(days);
    daysByOwner.set(key, list);
  }

  const averages = [...daysByOwner.entries()]
    .filter(([, days]) => days.length >= 3)
    .map(([owner, days]) => ({
      owner,
      avgDays: days.reduce((sum, d) => sum + d, 0) / days.length,
      count: days.length,
    }));
  if (averages.length < 2) return null;

  const sorted = [...averages].sort((a, b) => a.avgDays - b.avgDays);
  const fastest = sorted[0];
  const others = sorted.slice(1);
  const othersAvg = others.reduce((sum, o) => sum + o.avgDays, 0) / others.length;
  if (othersAvg <= 0) return null;

  const deviation = ((othersAvg - fastest.avgDays) / othersAvg) * 100;
  if (deviation < 15) return null;

  return {
    id: `vendedor-velocidade-${fastest.owner}`,
    title: `${fastest.owner} fecha vendas mais rápido`,
    description: `${fastest.owner} está fechando vendas ${pct(deviation)} mais rápido que a média dos demais vendedores.`,
    category: "comercial",
    polarity: "positivo",
    evidence: [
      { label: "Ciclo médio do vendedor", value: `${fastest.avgDays.toFixed(1)} dias` },
      { label: "Ciclo médio dos demais", value: `${othersAvg.toFixed(1)} dias` },
      { label: "Vendas consideradas", value: String(fastest.count) },
    ],
  };
}

/** "O tempo médio entre etapas mudou nos últimos X dias" — reaproveita a
 * tendência já calculada pela Fase 19 (domain/intelligence/trends.ts,
 * chave "tempo_medio_venda") em vez de recalcular período atual vs anterior. */
export function insightSalesCycleTrend(trends: IntelligenceTrend[]): RevenueInsight | null {
  const trend = trends.find((t) => t.key === "tempo_medio_venda");
  if (!trend || trend.changePercent === null || Math.abs(trend.changePercent) < 10) return null;

  const direction = trend.direction === "subindo" ? "aumentou" : "diminuiu";
  return {
    id: "ciclo-vendas-tendencia",
    title: `Ciclo médio de vendas ${direction}`,
    description: `O tempo médio até fechar uma venda ${direction} ${pct(Math.abs(trend.changePercent))} em relação ao período anterior.`,
    category: "comercial",
    polarity: trend.favorable ? "positivo" : "negativo",
    evidence: [
      { label: "Período atual", value: `${trend.currentValue.toFixed(1)} ${trend.unit}` },
      { label: "Período anterior", value: `${trend.previousValue.toFixed(1)} ${trend.unit}` },
    ],
  };
}

export function buildRevenueInsights(
  campaignRows: CampaignRow[],
  channelRows: ConversionBreakdownRow[],
  originRows: ConversionBreakdownRow[],
  leads: RevenueLeadRow[],
  trends: IntelligenceTrend[],
): RevenueInsight[] {
  const candidates = [
    insightBestCampaignRoi(campaignRows),
    insightBestConvertingDimension(channelRows, "Canal"),
    insightBestConvertingDimension(originRows, "Origem"),
    insightFastestSeller(leads),
    insightSalesCycleTrend(trends),
  ];
  return candidates.filter((insight): insight is RevenueInsight => insight !== null);
}

/** Vendedores/campanhas com conversão notavelmente acima ou abaixo da média
 * do próprio conjunto — para a aba de Detecção Automática. */
export function computeConversionOutliers(
  vendedorRows: ConversionBreakdownRow[],
  campanhaRows: ConversionBreakdownRow[],
): ConversionOutlierRow[] {
  function outliersFor(
    rows: ConversionBreakdownRow[],
    dimension: "vendedor" | "campanha",
  ): ConversionOutlierRow[] {
    const withSample = rows.filter((row) => row.leads >= MIN_SAMPLE);
    if (withSample.length < 2) return [];
    const avg = withSample.reduce((sum, row) => sum + row.conversionRate, 0) / withSample.length;
    if (avg <= 0) return [];

    return withSample
      .map((row) => ({
        dimension,
        label: row.label,
        conversionRate: row.conversionRate,
        averageConversionRate: avg,
        deviationPercent: ((row.conversionRate - avg) / avg) * 100,
        direction: row.conversionRate >= avg ? ("acima" as const) : ("abaixo" as const),
      }))
      .filter((row) => Math.abs(row.deviationPercent) >= 20)
      .sort((a, b) => Math.abs(b.deviationPercent) - Math.abs(a.deviationPercent));
  }

  return [...outliersFor(vendedorRows, "vendedor"), ...outliersFor(campanhaRows, "campanha")];
}
