import { type AiSuggestionDraft, formatCurrency } from "@/domain/ai/suggestionDraft";
import type { CampaignRow } from "@/types/marketing";

export interface MarketingInsightsInput {
  campaigns: CampaignRow[];
  overallCac: number | null;
  overallRoas: number | null;
}

function campaignLabel(campaign: CampaignRow): string {
  return campaign.utmCampaign ?? campaign.utmSource ?? campaign.key;
}

/** Assistente de Marketing (Fase 26) — 100% derivado de
 * application/marketingAnalytics/campaignsQueries.ts::getCampaignRows e
 * application/financial/financialMarketingQueries.ts (CAC/ROAS gerais), já
 * usados pelo módulo de Marketing Intelligence — nenhuma métrica nova. */
export function buildMarketingInsights(input: MarketingInsightsInput): AiSuggestionDraft[] {
  const { campaigns, overallCac, overallRoas } = input;
  const drafts: AiSuggestionDraft[] = [];

  const withRoas = campaigns.filter(
    (c) => c.roas.available && c.roas.value !== null && c.leads > 0,
  );

  const worstRoas = [...withRoas]
    .sort((a, b) => (a.roas.value ?? 0) - (b.roas.value ?? 0))
    .slice(0, 3);
  const lowPerformers = worstRoas.filter((c) => (c.roas.value ?? 0) < 1);
  drafts.push({
    type: "campanha_baixo_desempenho",
    module: "marketing",
    contextRef: null,
    title: "Campanhas com baixo desempenho",
    content:
      lowPerformers.length > 0
        ? lowPerformers
            .map(
              (c) =>
                `• ${campaignLabel(c)} — ROAS ${(c.roas.value ?? 0).toFixed(2)}x, ${c.leads} lead(s)`,
            )
            .join("\n")
        : "Nenhuma campanha com ROAS abaixo de 1x no momento.",
    severity: lowPerformers.length > 0 ? "atencao" : "info",
    evidence: [],
  });

  const bestRoas = [...withRoas]
    .sort((a, b) => (b.roas.value ?? 0) - (a.roas.value ?? 0))
    .slice(0, 3);
  drafts.push({
    type: "campanha_promissora",
    module: "marketing",
    contextRef: null,
    title: "Campanhas promissoras",
    content:
      bestRoas.length > 0
        ? bestRoas
            .map(
              (c) =>
                `• ${campaignLabel(c)} — ROAS ${(c.roas.value ?? 0).toFixed(2)}x, ${c.clients} cliente(s) gerado(s)`,
            )
            .join("\n")
        : "Nenhuma campanha com dados suficientes de ROAS ainda.",
    severity: "info",
    evidence: [],
  });

  const bestConversion = [...campaigns]
    .filter((c) => c.leads >= 3)
    .sort((a, b) => b.conversionRate - a.conversionRate)
    .slice(0, 3);
  drafts.push({
    type: "conversao_alta",
    module: "marketing",
    contextRef: null,
    title: "Leads com maior taxa de conversão",
    content:
      bestConversion.length > 0
        ? bestConversion
            .map(
              (c) =>
                `• ${campaignLabel(c)} — ${c.conversionRate.toFixed(1)}% de conversão (${c.leads} lead(s))`,
            )
            .join("\n")
        : "Ainda não há campanhas com volume suficiente de leads para medir conversão.",
    severity: "info",
    evidence: [],
  });

  const cacAlerts = campaigns
    .filter((c) => c.investment.available && c.investment.value !== null && c.clients > 0)
    .map((c) => ({ campaign: c, cac: (c.investment.value as number) / c.clients }))
    .filter((row) => overallCac !== null && row.cac > overallCac * 1.3)
    .sort((a, b) => b.cac - a.cac)
    .slice(0, 3);
  drafts.push({
    type: "cac_alto",
    module: "marketing",
    contextRef: null,
    title: "CAC acima da média",
    content:
      cacAlerts.length > 0
        ? cacAlerts
            .map((row) => `• ${campaignLabel(row.campaign)} — CAC ${formatCurrency(row.cac)}`)
            .join("\n")
        : `Nenhuma campanha com CAC acima de 1,3x a média${overallCac !== null ? ` (${formatCurrency(overallCac)})` : ""}.`,
    severity: cacAlerts.length > 0 ? "atencao" : "info",
    evidence:
      overallCac !== null ? [{ label: "CAC médio geral", value: formatCurrency(overallCac) }] : [],
  });

  const roasAlerts = withRoas
    .filter((c) => overallRoas !== null && (c.roas.value ?? 0) < overallRoas * 0.7)
    .sort((a, b) => (a.roas.value ?? 0) - (b.roas.value ?? 0))
    .slice(0, 3);
  drafts.push({
    type: "roas_baixo",
    module: "marketing",
    contextRef: null,
    title: "ROAS abaixo do esperado",
    content:
      roasAlerts.length > 0
        ? roasAlerts
            .map((c) => `• ${campaignLabel(c)} — ROAS ${(c.roas.value ?? 0).toFixed(2)}x`)
            .join("\n")
        : "Nenhuma campanha com ROAS significativamente abaixo da média geral.",
    severity: roasAlerts.length > 0 ? "atencao" : "info",
    evidence:
      overallRoas !== null
        ? [{ label: "ROAS médio geral", value: `${overallRoas.toFixed(2)}x` }]
        : [],
  });

  return drafts;
}
