import { MARKETING_ORIGIN_LABEL } from "@/domain/marketing/originRules";
import type { StageAvgDuration, StageConversion } from "@/repositories/crm/dashboardRepository";
import type {
  ConversionBreakdownRow,
  ConversionDimension,
  RevenueLeadRow,
  StageCycleTimeRow,
} from "@/types/revenueIntelligence";

/** "Cliente" aqui é o mesmo critério já usado por getOriginMetrics/
 * getCampaignRows (application/marketingAnalytics): clientCreatedAt !== null,
 * não apenas "está na etapa ganho" — um lead pode ganhar e o cliente ainda
 * não ter sido formalmente criado, ou vice-versa em dados legados. */
function buildBreakdown(
  leads: RevenueLeadRow[],
  keyFn: (lead: RevenueLeadRow) => string,
  limit = 10,
): ConversionBreakdownRow[] {
  const groups = new Map<string, RevenueLeadRow[]>();
  for (const lead of leads) {
    const key = keyFn(lead);
    const list = groups.get(key);
    if (list) list.push(lead);
    else groups.set(key, [lead]);
  }

  return [...groups.entries()]
    .map(([label, group]) => {
      const clients = group.filter((lead) => lead.clientCreatedAt !== null).length;
      return {
        label,
        leads: group.length,
        clients,
        conversionRate: group.length > 0 ? (clients / group.length) * 100 : 0,
      };
    })
    .sort((a, b) => b.leads - a.leads)
    .slice(0, limit);
}

const MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit" });
function periodLabel(iso: string): string {
  const d = new Date(iso);
  const label = MONTH_LABEL_FORMATTER.format(new Date(d.getFullYear(), d.getMonth(), 1));
  return label.charAt(0).toUpperCase() + label.slice(1).replace(".", "");
}

/** As 6 dimensões com dado real por trás (vendedor/campanha/origem/cidade/
 * canal/período) — "segmento" e "serviço", pedidos no briefing da Fase 22,
 * não têm campo correspondente em lead/cliente/transação hoje (ver relatório
 * final) e não foram implementados para não inventar schema/regra nova. */
export function buildConversionBreakdowns(
  leads: RevenueLeadRow[],
): Record<ConversionDimension, ConversionBreakdownRow[]> {
  return {
    vendedor: buildBreakdown(leads, (lead) => lead.ownerName ?? "Sem responsável"),
    campanha: buildBreakdown(leads, (lead) => lead.utmCampaign ?? "Sem campanha"),
    origem: buildBreakdown(leads, (lead) => MARKETING_ORIGIN_LABEL[lead.origin]),
    cidade: buildBreakdown(leads, (lead) => lead.city ?? "Sem cidade"),
    canal: buildBreakdown(leads, (lead) => lead.utmMedium ?? "Sem canal"),
    periodo: buildBreakdown(leads, (lead) => periodLabel(lead.createdAt)),
  };
}

/** Tempo médio por etapa do funil REALMENTE configurado (novo → contato →
 * qualificado → proposta → fechado) — não as 6 etapas ilustrativas do
 * briefing ("Reunião", "Implantação", "Cliente ativo"), que não existem como
 * pipeline_stages neste projeto. "Venda → Implantação" é reaproveitado à
 * parte, do tempo médio de entrega de projeto já calculado
 * (ProjectsHealth.averageDeliveryDays), sem criar etapas novas. */
export function buildStageCycle(
  stageConversion: StageConversion[],
  stageAvgDuration: StageAvgDuration[],
): StageCycleTimeRow[] {
  const avgByStage = new Map(stageAvgDuration.map((d) => [d.stage.id, d.avgDays]));
  return [...stageConversion]
    .sort((a, b) => a.stage.position - b.stage.position)
    .map((c) => ({
      stageLabel: c.stage.label,
      avgDays: avgByStage.get(c.stage.id) ?? null,
      conversionFromPrevious: c.conversionFromPrevious,
    }));
}
