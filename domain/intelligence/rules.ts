import type { OperationalDataset } from "@/domain/intelligence/dataset";
import { resolveThreshold } from "@/domain/intelligence/thresholds";
import { percentChange } from "@/domain/intelligence/trends";
import type {
  IntelligenceCategory,
  IntelligenceEvidenceItem,
  IntelligenceSeverity,
  IntelligenceTrendDirection,
} from "@/types/intelligence";

export interface InsightCandidate {
  ruleKey: string;
  type: string;
  category: IntelligenceCategory;
  severity: IntelligenceSeverity;
  title: string;
  description: string;
  metricValue: number | null;
  metricUnit: string | null;
  trend: IntelligenceTrendDirection | null;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  evidence: IntelligenceEvidenceItem[];
}

export interface AlertCandidate {
  ruleKey: string;
  type: string;
  category: IntelligenceCategory;
  severity: IntelligenceSeverity;
  title: string;
  description: string;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  evidence: IntelligenceEvidenceItem[];
}

type RuleConfig = Record<string, Record<string, number>>;

function pct(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}
function brl(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function days(value: number): string {
  return `${Math.round(value)} dia${Math.round(value) === 1 ? "" : "s"}`;
}

// ============================================================================
// INSIGHTS — comercial
// ============================================================================

const MIN_STALE_LEADS_TO_FLAG = 3;

function ruleLeadsParados(
  dataset: OperationalDataset,
  config: RuleConfig,
): InsightCandidate | null {
  const { staleLeads } = dataset.crm;
  if (staleLeads.length < MIN_STALE_LEADS_TO_FLAG) return null;
  const staleDays = resolveThreshold("leads_parados", "staleDays", config);

  return {
    ruleKey: "leads_parados",
    type: "leads_parados",
    category: "comercial",
    severity: staleLeads.length >= MIN_STALE_LEADS_TO_FLAG * 2 ? "critico" : "atencao",
    title: "Leads parados acima do esperado",
    description: `Existem ${staleLeads.length} leads em aberto sem interação há mais de ${staleDays} dias.`,
    metricValue: staleLeads.length,
    metricUnit: "leads",
    trend: null,
    relatedEntityType: null,
    relatedEntityId: null,
    evidence: staleLeads.slice(0, 10).map((lead) => ({
      label: lead.name,
      value: `${lead.company ?? "—"} · ${days(lead.daysSinceContact)} sem contato`,
    })),
  };
}

function ruleResponsavelBaixaConversao(
  dataset: OperationalDataset,
  config: RuleConfig,
): InsightCandidate | null {
  const minLeads = resolveThreshold("responsavel_baixa_conversao", "minLeads", config);
  const belowAveragePercent = resolveThreshold(
    "responsavel_baixa_conversao",
    "belowAveragePercent",
    config,
  );

  const eligible = dataset.crm.ownerConversion.filter((o) => o.totalLeads >= minLeads);
  if (eligible.length < 2) return null;

  const avgWinRate = eligible.reduce((sum, o) => sum + o.winRate, 0) / eligible.length;
  const worst = [...eligible].sort((a, b) => a.winRate - b.winRate)[0];
  if (!worst) return null;

  const isBelow = worst.winRate < avgWinRate * (1 - belowAveragePercent / 100);
  if (!isBelow) return null;

  return {
    ruleKey: "responsavel_baixa_conversao",
    type: "responsavel_baixa_conversao",
    category: "comercial",
    severity: "atencao",
    title: "Responsável com baixa conversão",
    description: `${worst.ownerName} converte ${pct(worst.winRate)} dos leads, abaixo da média da equipe (${pct(avgWinRate)}).`,
    metricValue: worst.winRate,
    metricUnit: "%",
    trend: null,
    relatedEntityType: "owner",
    relatedEntityId: worst.ownerId,
    evidence: eligible
      .sort((a, b) => a.winRate - b.winRate)
      .map((o) => ({
        label: o.ownerName,
        value: `${pct(o.winRate)} (${o.wonLeads}/${o.totalLeads} leads)`,
      })),
  };
}

function ruleClienteParado(
  dataset: OperationalDataset,
  config: RuleConfig,
): InsightCandidate | null {
  const staleDays = resolveThreshold("cliente_parado", "staleDays", config);
  const cutoff = Date.now() - staleDays * 86_400_000;

  const lastTouchByClient = new Map<string, { company: string; lastAt: number }>();
  for (const project of dataset.projects.allActive) {
    const at = new Date(project.updatedAt).getTime();
    const existing = lastTouchByClient.get(project.clientId);
    if (!existing || at > existing.lastAt) {
      lastTouchByClient.set(project.clientId, {
        company: project.clientCompany ?? "—",
        lastAt: at,
      });
    }
  }

  const stale = [...lastTouchByClient.entries()]
    .filter(([, v]) => v.lastAt < cutoff)
    .sort((a, b) => a[1].lastAt - b[1].lastAt);

  if (stale.length === 0) return null;
  const [topClientId, topClient] = stale[0];

  return {
    ruleKey: "cliente_parado",
    type: "cliente_parado",
    category: "comercial",
    severity: stale.length >= 3 ? "critico" : "atencao",
    title: "Cliente parado há muito tempo",
    description: `${topClient.company} não tem movimentação de projeto há mais de ${staleDays} dias — ${stale.length} cliente${stale.length === 1 ? "" : "s"} nessa condição.`,
    metricValue: stale.length,
    metricUnit: "clientes",
    trend: null,
    relatedEntityType: "client",
    relatedEntityId: topClientId,
    evidence: stale.slice(0, 10).map(([, v]) => ({
      label: v.company,
      value: `Sem movimentação desde ${new Date(v.lastAt).toLocaleDateString("pt-BR")}`,
    })),
  };
}

function rulePipelineCongestionado(
  dataset: OperationalDataset,
  config: RuleConfig,
): InsightCandidate | null {
  const multiplier = resolveThreshold("pipeline_congestionado", "multiplier", config);
  const counts = dataset.crm.current.stageCounts.filter((s) => !s.stage.isWon);
  if (counts.length < 2) return null;

  const avgCount = counts.reduce((sum, s) => sum + s.count, 0) / counts.length;
  const worst = [...counts].sort((a, b) => b.count - a.count)[0];
  if (avgCount === 0 || worst.count < avgCount * multiplier) return null;

  return {
    ruleKey: "pipeline_congestionado",
    type: "pipeline_congestionado",
    category: "comercial",
    severity: "atencao",
    title: "Pipeline congestionado",
    description: `A etapa "${worst.stage.label}" concentra ${worst.count} leads, bem acima da média das demais etapas (${avgCount.toFixed(1)}).`,
    metricValue: worst.count,
    metricUnit: "leads",
    trend: null,
    relatedEntityType: "stage",
    relatedEntityId: worst.stage.id,
    evidence: counts.map((s) => ({ label: s.stage.label, value: `${s.count} leads` })),
  };
}

function ruleQuedaConversao(
  dataset: OperationalDataset,
  config: RuleConfig,
): InsightCandidate | null {
  const dropPercent = resolveThreshold("queda_conversao", "dropPercent", config);
  const { current, previous } = dataset.marketing;
  const change = percentChange(current.conversionRate, previous.conversionRate);
  if (change === null || change > -dropPercent) return null;

  return {
    ruleKey: "queda_conversao",
    type: "queda_conversao",
    category: "comercial",
    severity: change < -dropPercent * 2 ? "critico" : "atencao",
    title: "Queda de conversão",
    description: `A taxa de conversão caiu ${pct(Math.abs(change))} em relação ao período anterior (${pct(current.conversionRate)} vs ${pct(previous.conversionRate)}).`,
    metricValue: current.conversionRate,
    metricUnit: "%",
    trend: "descendo",
    relatedEntityType: null,
    relatedEntityId: null,
    evidence: [
      { label: "Período atual", value: pct(current.conversionRate) },
      { label: "Período anterior", value: pct(previous.conversionRate) },
    ],
  };
}

function ruleCicloVendaExcessivo(
  dataset: OperationalDataset,
  config: RuleConfig,
): InsightCandidate | null {
  const benchmarkDays = resolveThreshold("ciclo_venda_excessivo", "benchmarkDays", config);
  const avg = dataset.crm.current.kpis.averageTimeToWinDays;
  if (avg === null || avg <= benchmarkDays) return null;

  return {
    ruleKey: "ciclo_venda_excessivo",
    type: "ciclo_venda_excessivo",
    category: "comercial",
    severity: "atencao",
    title: "Tempo excessivo para fechar negócios",
    description: `O tempo médio até o fechamento está em ${days(avg)}, acima do esperado (${days(benchmarkDays)}).`,
    metricValue: avg,
    metricUnit: "dias",
    trend: null,
    relatedEntityType: null,
    relatedEntityId: null,
    evidence: [
      { label: "Tempo médio atual", value: days(avg) },
      { label: "Referência esperada", value: days(benchmarkDays) },
    ],
  };
}

// ============================================================================
// INSIGHTS — marketing
// ============================================================================

function ruleCampanhaMelhorRoi(dataset: OperationalDataset): InsightCandidate | null {
  const eligible = dataset.marketing.campaigns.filter(
    (c) => c.investment.available && (c.investment.value ?? 0) > 0 && c.roi.available,
  );
  if (eligible.length === 0) return null;
  const best = [...eligible].sort((a, b) => (b.roi.value ?? 0) - (a.roi.value ?? 0))[0];
  if (!best || (best.roi.value ?? 0) <= 0) return null;

  return {
    ruleKey: "campanha_melhor_roi",
    type: "campanha_melhor_roi",
    category: "marketing",
    severity: "info",
    title: "Campanha com melhor ROI",
    description: `A campanha "${best.utmCampaign ?? best.utmSource ?? best.key}" tem o melhor ROI do período (${pct(best.roi.value ?? 0)}).`,
    metricValue: best.roi.value,
    metricUnit: "%",
    trend: null,
    relatedEntityType: "campaign",
    relatedEntityId: null,
    evidence: eligible
      .sort((a, b) => (b.roi.value ?? 0) - (a.roi.value ?? 0))
      .slice(0, 5)
      .map((c) => ({ label: c.utmCampaign ?? c.utmSource ?? c.key, value: pct(c.roi.value ?? 0) })),
  };
}

function ruleCampanhaPiorRoi(dataset: OperationalDataset): InsightCandidate | null {
  const eligible = dataset.marketing.campaigns.filter(
    (c) => c.investment.available && (c.investment.value ?? 0) > 0 && c.roi.available,
  );
  if (eligible.length === 0) return null;
  const worst = [...eligible].sort((a, b) => (a.roi.value ?? 0) - (b.roi.value ?? 0))[0];
  if (!worst || (worst.roi.value ?? 0) >= 0) return null;

  return {
    ruleKey: "campanha_pior_roi",
    type: "campanha_pior_roi",
    category: "marketing",
    severity: "atencao",
    title: "Campanha com pior ROI",
    description: `A campanha "${worst.utmCampaign ?? worst.utmSource ?? worst.key}" tem o pior ROI do período (${pct(worst.roi.value ?? 0)}).`,
    metricValue: worst.roi.value,
    metricUnit: "%",
    trend: null,
    relatedEntityType: "campaign",
    relatedEntityId: null,
    evidence: eligible
      .sort((a, b) => (a.roi.value ?? 0) - (b.roi.value ?? 0))
      .slice(0, 5)
      .map((c) => ({ label: c.utmCampaign ?? c.utmSource ?? c.key, value: pct(c.roi.value ?? 0) })),
  };
}

function ruleOrigemMaiorFechamento(dataset: OperationalDataset): InsightCandidate | null {
  const eligible = dataset.marketing.origins.filter((o) => o.leads >= 3);
  if (eligible.length === 0) return null;
  const best = [...eligible].sort((a, b) => b.conversionRate - a.conversionRate)[0];
  if (!best || best.conversionRate <= 0) return null;

  return {
    ruleKey: "origem_maior_fechamento",
    type: "origem_maior_fechamento",
    category: "marketing",
    severity: "info",
    title: "Origem com maior taxa de fechamento",
    description: `${best.label} converte ${pct(best.conversionRate)} dos leads em clientes, a maior taxa entre as origens.`,
    metricValue: best.conversionRate,
    metricUnit: "%",
    trend: null,
    relatedEntityType: "origin",
    relatedEntityId: null,
    evidence: eligible
      .sort((a, b) => b.conversionRate - a.conversionRate)
      .map((o) => ({ label: o.label, value: pct(o.conversionRate) })),
  };
}

function ruleOrigemMaiorTicket(dataset: OperationalDataset): InsightCandidate | null {
  const withTicket = dataset.marketing.origins
    .filter((o) => o.clients > 0)
    .map((o) => ({ origin: o, ticket: o.revenue / o.clients }));
  if (withTicket.length === 0) return null;

  const best = [...withTicket].sort((a, b) => b.ticket - a.ticket)[0];
  if (!best || best.ticket <= 0) return null;

  return {
    ruleKey: "origem_maior_ticket",
    type: "origem_maior_ticket",
    category: "marketing",
    severity: "info",
    title: "Origem com maior ticket médio",
    description: `${best.origin.label} tem o maior ticket médio por cliente (${brl(best.ticket)}).`,
    metricValue: best.ticket,
    metricUnit: "R$",
    trend: null,
    relatedEntityType: "origin",
    relatedEntityId: null,
    evidence: withTicket
      .sort((a, b) => b.ticket - a.ticket)
      .map((w) => ({ label: w.origin.label, value: brl(w.ticket) })),
  };
}

function ruleCacSubindo(dataset: OperationalDataset, config: RuleConfig): InsightCandidate | null {
  const growthPercent = resolveThreshold("cac_subindo", "growthPercent", config);
  const { current, previous } = dataset.marketing;
  if (!current.cac.available || !previous.cac.available) return null;
  const change = percentChange(current.cac.value ?? 0, previous.cac.value ?? 0);
  if (change === null || change < growthPercent) return null;

  return {
    ruleKey: "cac_subindo",
    type: "cac_subindo",
    category: "marketing",
    severity: change > growthPercent * 2 ? "critico" : "atencao",
    title: "Aumento do CAC",
    description: `O custo de aquisição de cliente subiu ${pct(change)} em relação ao período anterior (${brl(current.cac.value ?? 0)} vs ${brl(previous.cac.value ?? 0)}).`,
    metricValue: current.cac.value,
    metricUnit: "R$",
    trend: "subindo",
    relatedEntityType: null,
    relatedEntityId: null,
    evidence: [
      { label: "CAC atual", value: brl(current.cac.value ?? 0) },
      { label: "CAC período anterior", value: brl(previous.cac.value ?? 0) },
    ],
  };
}

function ruleRoasCaindo(dataset: OperationalDataset, config: RuleConfig): InsightCandidate | null {
  const dropPercent = resolveThreshold("roas_caindo", "dropPercent", config);
  const { current, previous } = dataset.marketing;
  if (!current.roas.available || !previous.roas.available) return null;
  const change = percentChange(current.roas.value ?? 0, previous.roas.value ?? 0);
  if (change === null || change > -dropPercent) return null;

  return {
    ruleKey: "roas_caindo",
    type: "roas_caindo",
    category: "marketing",
    severity: change < -dropPercent * 2 ? "critico" : "atencao",
    title: "Redução do ROAS",
    description: `O ROAS caiu ${pct(Math.abs(change))} em relação ao período anterior (${(current.roas.value ?? 0).toFixed(2)}x vs ${(previous.roas.value ?? 0).toFixed(2)}x).`,
    metricValue: current.roas.value,
    metricUnit: "x",
    trend: "descendo",
    relatedEntityType: null,
    relatedEntityId: null,
    evidence: [
      { label: "ROAS atual", value: `${(current.roas.value ?? 0).toFixed(2)}x` },
      { label: "ROAS período anterior", value: `${(previous.roas.value ?? 0).toFixed(2)}x` },
    ],
  };
}

function ruleTicketMedioCaindo(
  dataset: OperationalDataset,
  config: RuleConfig,
): InsightCandidate | null {
  const dropPercent = resolveThreshold("ticket_medio_caindo", "dropPercent", config);
  const { current, previous } = dataset.marketing;
  if (current.averageTicket === null || previous.averageTicket === null) return null;
  const change = percentChange(current.averageTicket, previous.averageTicket);
  if (change === null || change > -dropPercent) return null;

  return {
    ruleKey: "ticket_medio_caindo",
    type: "ticket_medio_caindo",
    category: "financeiro",
    severity: "atencao",
    title: "Redução do Ticket Médio",
    description: `O ticket médio caiu ${pct(Math.abs(change))} em relação ao período anterior (${brl(current.averageTicket)} vs ${brl(previous.averageTicket)}).`,
    metricValue: current.averageTicket,
    metricUnit: "R$",
    trend: "descendo",
    relatedEntityType: null,
    relatedEntityId: null,
    evidence: [
      { label: "Ticket médio atual", value: brl(current.averageTicket) },
      { label: "Ticket médio período anterior", value: brl(previous.averageTicket) },
    ],
  };
}

// ============================================================================
// INSIGHTS — financeiro / atendimento
// ============================================================================

function ruleInadimplenciaCrescente(
  dataset: OperationalDataset,
  config: RuleConfig,
): InsightCandidate | null {
  const growthPercent = resolveThreshold("inadimplencia_crescente", "growthPercent", config);
  const { current, previousOverdueAmount } = dataset.financial;
  if (previousOverdueAmount === null) return null;
  const change = percentChange(current.overdueAmount, previousOverdueAmount);
  if (change === null || change < growthPercent) return null;

  return {
    ruleKey: "inadimplencia_crescente",
    type: "inadimplencia_crescente",
    category: "financeiro",
    severity: "critico",
    title: "Financeiro com inadimplência crescente",
    description: `O valor vencido em aberto cresceu ${pct(change)} em relação ao período anterior (${brl(current.overdueAmount)} vs ${brl(previousOverdueAmount)}).`,
    metricValue: current.overdueAmount,
    metricUnit: "R$",
    trend: "subindo",
    relatedEntityType: null,
    relatedEntityId: null,
    evidence: [
      { label: "Vencido atual", value: brl(current.overdueAmount) },
      { label: "Vencido período anterior", value: brl(previousOverdueAmount) },
      { label: "Contas vencidas", value: `${current.overdueCount}` },
    ],
  };
}

function ruleTempoRespostaSubindo(
  dataset: OperationalDataset,
  config: RuleConfig,
): InsightCandidate | null {
  const growthPercent = resolveThreshold("tempo_resposta_subindo", "growthPercent", config);
  const { averageResponseMinutes, previousAverageResponseMinutes } = dataset.communication;
  if (averageResponseMinutes === null || previousAverageResponseMinutes === null) return null;
  const change = percentChange(averageResponseMinutes, previousAverageResponseMinutes);
  if (change === null || change < growthPercent) return null;

  return {
    ruleKey: "tempo_resposta_subindo",
    type: "tempo_resposta_subindo",
    category: "atendimento",
    severity: "atencao",
    title: "Tempo médio de resposta aumentando",
    description: `O tempo médio de resposta subiu ${pct(change)} em relação ao período anterior (${averageResponseMinutes.toFixed(0)} min vs ${previousAverageResponseMinutes.toFixed(0)} min).`,
    metricValue: averageResponseMinutes,
    metricUnit: "min",
    trend: "subindo",
    relatedEntityType: null,
    relatedEntityId: null,
    evidence: [
      { label: "Tempo médio atual", value: `${averageResponseMinutes.toFixed(0)} min` },
      {
        label: "Tempo médio período anterior",
        value: `${previousAverageResponseMinutes.toFixed(0)} min`,
      },
    ],
  };
}

// ============================================================================
// INSIGHTS — projetos
// ============================================================================

function ruleProjetosAtrasados(dataset: OperationalDataset): InsightCandidate | null {
  const { overdue } = dataset.projects;
  if (overdue.length === 0) return null;

  return {
    ruleKey: "projetos_atrasados",
    type: "projetos_atrasados",
    category: "projetos",
    severity: overdue.length >= 3 ? "critico" : "atencao",
    title: "Projetos atrasados",
    description: `${overdue.length} projeto${overdue.length === 1 ? "" : "s"} com prazo vencido e ainda não concluído${overdue.length === 1 ? "" : "s"}.`,
    metricValue: overdue.length,
    metricUnit: "projetos",
    trend: null,
    relatedEntityType: null,
    relatedEntityId: null,
    evidence: overdue.slice(0, 10).map((p) => ({
      label: p.name,
      value: `${p.clientCompany ?? "—"} · ${days(p.daysOverdue)} de atraso`,
    })),
  };
}

export function generateInsightCandidates(
  dataset: OperationalDataset,
  config: RuleConfig,
): InsightCandidate[] {
  const candidates = [
    ruleLeadsParados(dataset, config),
    ruleResponsavelBaixaConversao(dataset, config),
    ruleCampanhaMelhorRoi(dataset),
    ruleCampanhaPiorRoi(dataset),
    ruleOrigemMaiorFechamento(dataset),
    ruleOrigemMaiorTicket(dataset),
    ruleClienteParado(dataset, config),
    ruleProjetosAtrasados(dataset),
    ruleInadimplenciaCrescente(dataset, config),
    ruleTempoRespostaSubindo(dataset, config),
    rulePipelineCongestionado(dataset, config),
    ruleQuedaConversao(dataset, config),
    ruleCacSubindo(dataset, config),
    ruleRoasCaindo(dataset, config),
    ruleTicketMedioCaindo(dataset, config),
    ruleCicloVendaExcessivo(dataset, config),
  ];
  return candidates.filter((c): c is InsightCandidate => c !== null);
}

// ============================================================================
// ALERTS — comercial
// ============================================================================

function alertLeadSemContato(
  dataset: OperationalDataset,
  config: RuleConfig,
): AlertCandidate | null {
  const minDays = resolveThreshold("lead_sem_contato", "days", config);
  const eligible = dataset.crm.neverContactedLeads.filter((l) => l.daysSinceContact >= minDays);
  if (eligible.length === 0) return null;

  return {
    ruleKey: "lead_sem_contato",
    type: "lead_sem_contato",
    category: "comercial",
    severity: "atencao",
    title: "Lead sem contato",
    description: `${eligible.length} lead${eligible.length === 1 ? "" : "s"} sem nenhum contato registrado há mais de ${minDays} dias.`,
    relatedEntityType: eligible.length === 1 ? "lead" : null,
    relatedEntityId: eligible.length === 1 ? eligible[0].id : null,
    evidence: eligible
      .slice(0, 10)
      .map((l) => ({ label: l.name, value: l.company ?? "Sem empresa" })),
  };
}

function alertLeadParado(dataset: OperationalDataset, config: RuleConfig): AlertCandidate | null {
  const minDays = resolveThreshold("lead_parado_alerta", "days", config);
  const eligible = dataset.crm.staleLeads.filter((l) => l.daysSinceContact >= minDays);
  if (eligible.length === 0) return null;

  return {
    ruleKey: "lead_parado_alerta",
    type: "lead_parado_alerta",
    category: "comercial",
    severity: "critico",
    title: "Lead parado",
    description: `${eligible.length} lead${eligible.length === 1 ? "" : "s"} em aberto sem qualquer interação há mais de ${minDays} dias.`,
    relatedEntityType: eligible.length === 1 ? "lead" : null,
    relatedEntityId: eligible.length === 1 ? eligible[0].id : null,
    evidence: eligible
      .slice(0, 10)
      .map((l) => ({ label: l.name, value: `${days(l.daysSinceContact)} sem contato` })),
  };
}

function alertPipelineSemMovimentacao(
  dataset: OperationalDataset,
  config: RuleConfig,
): AlertCandidate | null {
  const minDays = resolveThreshold("pipeline_sem_movimentacao", "days", config);
  const since = dataset.crm.daysSinceLastStageChange;
  if (since === null || since < minDays) return null;

  return {
    ruleKey: "pipeline_sem_movimentacao",
    type: "pipeline_sem_movimentacao",
    category: "comercial",
    severity: "atencao",
    title: "Pipeline sem movimentação",
    description: `Nenhuma mudança de etapa no funil comercial há ${days(since)}.`,
    relatedEntityType: null,
    relatedEntityId: null,
    evidence: [{ label: "Última mudança de etapa", value: `há ${days(since)}` }],
  };
}

function alertQuedaBruscaVendas(
  dataset: OperationalDataset,
  config: RuleConfig,
): AlertCandidate | null {
  const dropPercent = resolveThreshold("queda_brusca_vendas", "dropPercent", config);
  const { current, previous } = dataset.marketing;
  const change = percentChange(current.clientsCount, previous.clientsCount);
  if (change === null || change > -dropPercent) return null;

  return {
    ruleKey: "queda_brusca_vendas",
    type: "queda_brusca_vendas",
    category: "comercial",
    severity: "critico",
    title: "Queda brusca nas vendas",
    description: `O número de clientes fechados caiu ${pct(Math.abs(change))} em relação ao período anterior (${current.clientsCount} vs ${previous.clientsCount}).`,
    relatedEntityType: null,
    relatedEntityId: null,
    evidence: [
      { label: "Clientes fechados no período", value: `${current.clientsCount}` },
      { label: "Clientes fechados período anterior", value: `${previous.clientsCount}` },
    ],
  };
}

// ============================================================================
// ALERTS — projetos / financeiro
// ============================================================================

function alertProjetoAtrasado(dataset: OperationalDataset): AlertCandidate | null {
  const critical = dataset.projects.overdue.filter((p) => p.daysOverdue >= 1);
  if (critical.length === 0) return null;
  const worst = [...critical].sort((a, b) => b.daysOverdue - a.daysOverdue)[0];

  return {
    ruleKey: "projeto_atrasado_alerta",
    type: "projeto_atrasado_alerta",
    category: "projetos",
    severity: "critico",
    title: "Projeto atrasado",
    description: `"${worst.name}" (${worst.clientCompany ?? "—"}) está ${days(worst.daysOverdue)} atrasado.`,
    relatedEntityType: "project",
    relatedEntityId: worst.id,
    evidence: critical.slice(0, 10).map((p) => ({
      label: p.name,
      value: `${p.clientCompany ?? "—"} · ${days(p.daysOverdue)} de atraso`,
    })),
  };
}

function alertClienteInadimplente(dataset: OperationalDataset): AlertCandidate | null {
  const { delinquentClients } = dataset.financial;
  if (delinquentClients.length === 0) return null;
  const worst = [...delinquentClients].sort((a, b) => b.overdueAmount - a.overdueAmount)[0];

  return {
    ruleKey: "cliente_inadimplente",
    type: "cliente_inadimplente",
    category: "financeiro",
    severity: "critico",
    title: "Cliente inadimplente",
    description: `${worst.clientCompany} tem ${brl(worst.overdueAmount)} em atraso (${worst.overdueCount} lançamento${worst.overdueCount === 1 ? "" : "s"}).`,
    relatedEntityType: "client",
    relatedEntityId: worst.clientId,
    evidence: delinquentClients
      .slice(0, 10)
      .map((c) => ({ label: c.clientCompany, value: brl(c.overdueAmount) })),
  };
}

function alertReceitaAbaixoMedia(
  dataset: OperationalDataset,
  config: RuleConfig,
): AlertCandidate | null {
  const belowAveragePercent = resolveThreshold(
    "receita_abaixo_media",
    "belowAveragePercent",
    config,
  );
  const { current, recentAverageRevenue } = dataset.financial;
  if (recentAverageRevenue === null || recentAverageRevenue === 0) return null;
  const change = percentChange(current.monthRevenue, recentAverageRevenue);
  if (change === null || change > -belowAveragePercent) return null;

  return {
    ruleKey: "receita_abaixo_media",
    type: "receita_abaixo_media",
    category: "financeiro",
    severity: "atencao",
    title: "Receita abaixo da média",
    description: `A receita do mês (${brl(current.monthRevenue)}) está ${pct(Math.abs(change))} abaixo da média recente (${brl(recentAverageRevenue)}).`,
    relatedEntityType: null,
    relatedEntityId: null,
    evidence: [
      { label: "Receita do mês", value: brl(current.monthRevenue) },
      { label: "Média recente", value: brl(recentAverageRevenue) },
    ],
  };
}

// ============================================================================
// ALERTS — marketing
// ============================================================================

function alertCampanhaSemConversao(dataset: OperationalDataset): AlertCandidate | null {
  const eligible = dataset.marketing.campaigns.filter(
    (c) => c.investment.available && (c.investment.value ?? 0) > 0 && c.clients === 0,
  );
  if (eligible.length === 0) return null;

  return {
    ruleKey: "campanha_sem_conversao",
    type: "campanha_sem_conversao",
    category: "marketing",
    severity: "atencao",
    title: "Campanha sem conversão",
    description: `${eligible.length} campanha${eligible.length === 1 ? "" : "s"} com investimento e nenhum cliente convertido.`,
    relatedEntityType: null,
    relatedEntityId: null,
    evidence: eligible.slice(0, 10).map((c) => ({
      label: c.utmCampaign ?? c.utmSource ?? c.key,
      value: brl(c.investment.value ?? 0),
    })),
  };
}

function alertCampanhaGastoElevado(
  dataset: OperationalDataset,
  config: RuleConfig,
): AlertCandidate | null {
  const roiThreshold = resolveThreshold("campanha_gasto_elevado", "roiThreshold", config);
  const eligible = dataset.marketing.campaigns.filter(
    (c) =>
      c.investment.available &&
      (c.investment.value ?? 0) > 0 &&
      c.roi.available &&
      (c.roi.value ?? 0) < roiThreshold,
  );
  if (eligible.length === 0) return null;
  const worst = [...eligible].sort(
    (a, b) => (b.investment.value ?? 0) - (a.investment.value ?? 0),
  )[0];

  return {
    ruleKey: "campanha_gasto_elevado",
    type: "campanha_gasto_elevado",
    category: "marketing",
    severity: "atencao",
    title: "Campanha com gasto elevado",
    description: `"${worst.utmCampaign ?? worst.utmSource ?? worst.key}" investiu ${brl(worst.investment.value ?? 0)} com ROI de ${pct(worst.roi.value ?? 0)}.`,
    relatedEntityType: "campaign",
    relatedEntityId: null,
    evidence: eligible.slice(0, 10).map((c) => ({
      label: c.utmCampaign ?? c.utmSource ?? c.key,
      value: `${brl(c.investment.value ?? 0)} · ROI ${pct(c.roi.value ?? 0)}`,
    })),
  };
}

// ============================================================================
// ALERTS — operacional
// ============================================================================

function alertIntegracaoComErro(dataset: OperationalDataset): AlertCandidate | null {
  if (dataset.integrations.errorIntegrations === 0) return null;
  return {
    ruleKey: "integracao_com_erro",
    type: "integracao_com_erro",
    category: "operacional",
    severity: "critico",
    title: "Integração com erro",
    description: `${dataset.integrations.errorIntegrations} integração${dataset.integrations.errorIntegrations === 1 ? "" : "ões"} reportando erro.`,
    relatedEntityType: null,
    relatedEntityId: null,
    evidence: [
      { label: "Integrações com erro", value: `${dataset.integrations.errorIntegrations}` },
      {
        label: "Taxa de sucesso geral",
        value:
          dataset.integrations.successRate !== null ? pct(dataset.integrations.successRate) : "—",
      },
    ],
  };
}

function alertWebhookFalhando(dataset: OperationalDataset): AlertCandidate | null {
  if (dataset.conversions.failedDeliveries === 0) return null;
  return {
    ruleKey: "webhook_falhando",
    type: "webhook_falhando",
    category: "operacional",
    severity: "critico",
    title: "Webhook falhando",
    description: `${dataset.conversions.failedDeliveries} entrega${dataset.conversions.failedDeliveries === 1 ? "" : "s"} de evento via webhook falhou no período.`,
    relatedEntityType: null,
    relatedEntityId: null,
    evidence: [
      { label: "Entregas falhadas", value: `${dataset.conversions.failedDeliveries}` },
      { label: "Entregas enviadas", value: `${dataset.conversions.sentDeliveries}` },
    ],
  };
}

function alertApiIndisponivel(
  dataset: OperationalDataset,
  config: RuleConfig,
): AlertCandidate | null {
  const minSuccessRate = resolveThreshold("api_indisponivel", "minSuccessRate", config);
  const { successRate, offlineIntegrations } = dataset.integrations;
  const belowThreshold = successRate !== null && successRate < minSuccessRate;
  if (!belowThreshold && offlineIntegrations === 0) return null;

  return {
    ruleKey: "api_indisponivel",
    type: "api_indisponivel",
    category: "operacional",
    severity: "critico",
    title: "API indisponível",
    description:
      offlineIntegrations > 0
        ? `${offlineIntegrations} integração${offlineIntegrations === 1 ? "" : "ões"} offline.`
        : `Taxa de sucesso das integrações em ${pct(successRate ?? 0)}, abaixo do aceitável (${minSuccessRate}%).`,
    relatedEntityType: null,
    relatedEntityId: null,
    evidence: [
      { label: "Integrações offline", value: `${offlineIntegrations}` },
      { label: "Taxa de sucesso", value: successRate !== null ? pct(successRate) : "—" },
    ],
  };
}

function alertStorageProximoLimite(
  dataset: OperationalDataset,
  config: RuleConfig,
): AlertCandidate | null {
  const limitBytes = resolveThreshold("storage_proximo_limite", "limitBytes", config);
  const warnPercent = resolveThreshold("storage_proximo_limite", "warnPercent", config);
  const usedPercent = (dataset.storage.totalBytes / limitBytes) * 100;
  if (usedPercent < warnPercent) return null;

  return {
    ruleKey: "storage_proximo_limite",
    type: "storage_proximo_limite",
    category: "operacional",
    severity: usedPercent >= 95 ? "critico" : "atencao",
    title: "Storage próximo do limite",
    description: `O armazenamento de arquivos está em ${pct(usedPercent)} do limite configurado.`,
    relatedEntityType: null,
    relatedEntityId: null,
    evidence: [
      { label: "Usado", value: `${(dataset.storage.totalBytes / (1024 * 1024)).toFixed(0)} MB` },
      { label: "Limite", value: `${(limitBytes / (1024 * 1024)).toFixed(0)} MB` },
    ],
  };
}

function alertFalhaAutomacao(
  dataset: OperationalDataset,
  config: RuleConfig,
): AlertCandidate | null {
  const minFailures = resolveThreshold("falha_automacao", "minFailures", config);
  if (dataset.automation.failuresToday < minFailures) return null;

  return {
    ruleKey: "falha_automacao",
    type: "falha_automacao",
    category: "operacional",
    severity: "critico",
    title: "Falha recorrente de automação",
    description: `${dataset.automation.failuresToday} falhas de execução de automação hoje.`,
    relatedEntityType: null,
    relatedEntityId: null,
    evidence: [
      { label: "Falhas hoje", value: `${dataset.automation.failuresToday}` },
      {
        label: "Taxa de sucesso",
        value: dataset.automation.successRate !== null ? pct(dataset.automation.successRate) : "—",
      },
    ],
  };
}

export function generateAlertCandidates(
  dataset: OperationalDataset,
  config: RuleConfig,
): AlertCandidate[] {
  const candidates = [
    alertLeadSemContato(dataset, config),
    alertLeadParado(dataset, config),
    alertProjetoAtrasado(dataset),
    alertClienteInadimplente(dataset),
    alertCampanhaSemConversao(dataset),
    alertCampanhaGastoElevado(dataset, config),
    alertReceitaAbaixoMedia(dataset, config),
    alertQuedaBruscaVendas(dataset, config),
    alertPipelineSemMovimentacao(dataset, config),
    alertIntegracaoComErro(dataset),
    alertWebhookFalhando(dataset),
    alertApiIndisponivel(dataset, config),
    alertStorageProximoLimite(dataset, config),
    alertFalhaAutomacao(dataset, config),
  ];
  return candidates.filter((c): c is AlertCandidate => c !== null);
}
