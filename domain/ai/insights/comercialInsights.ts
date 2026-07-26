import { type AiSuggestionDraft, daysSince } from "@/domain/ai/suggestionDraft";
import type { CrmLeadWithRelations } from "@/types/crm";

export interface ComercialInsightsInput {
  leads: CrmLeadWithRelations[];
  now: Date;
  stageAvgDaysByStageId: Map<string, number | null>;
  daysInStageByLeadId: Map<string, number>;
}

function isOpen(lead: CrmLeadWithRelations): boolean {
  return lead.lostAt === null && !lead.stage.isWon;
}

/** Assistente Comercial (Fase 26) — 100% derivado de
 * application/crm/leadsQueries.ts (getLeadsPageData/getPipelineData) e
 * application/crm/dashboardQueries.ts (tempo médio por etapa), já usados
 * pelo CRM e por Performance (Fase 23) — nenhuma métrica nova. */
export function buildComercialInsights(input: ComercialInsightsInput): AiSuggestionDraft[] {
  const { leads, now, stageAvgDaysByStageId, daysInStageByLeadId } = input;
  const openLeads = leads.filter(isOpen);
  const drafts: AiSuggestionDraft[] = [];

  const forgotten = openLeads
    .map((lead) => ({ lead, days: daysSince(lead.lastInteractionAt, now) }))
    .filter((row) => row.days === null || row.days >= 10)
    .sort((a, b) => (b.days ?? 9999) - (a.days ?? 9999))
    .slice(0, 5);
  drafts.push({
    type: "lead_esquecido",
    module: "comercial",
    contextRef: null,
    title: "Leads esquecidos",
    content:
      forgotten.length > 0
        ? forgotten
            .map(
              (row) =>
                `• ${row.lead.name} — ${row.days !== null ? `${row.days} dia(s) sem contato` : "nunca contatado"}`,
            )
            .join("\n")
        : "Nenhum lead aberto está há mais de 10 dias sem contato.",
    severity: forgotten.length > 0 ? "critico" : "info",
    evidence: [],
  });

  const neverContacted = openLeads.filter((lead) => lead.lastInteractionAt === null).slice(0, 5);
  drafts.push({
    type: "lead_sem_contato",
    module: "comercial",
    contextRef: null,
    title: "Leads sem contato",
    content:
      neverContacted.length > 0
        ? neverContacted.map((lead) => `• ${lead.name} — etapa "${lead.stage.label}"`).join("\n")
        : "Todos os leads abertos já tiveram ao menos um contato registrado.",
    severity: neverContacted.length > 0 ? "atencao" : "info",
    evidence: [],
  });

  const opportunities = openLeads
    .filter((lead) => lead.stage.position >= 4 && lead.score >= 50)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  drafts.push({
    type: "oportunidade",
    module: "comercial",
    contextRef: null,
    title: "Próximas oportunidades",
    content:
      opportunities.length > 0
        ? opportunities
            .map((lead) => `• ${lead.name} — score ${lead.score}, etapa "${lead.stage.label}"`)
            .join("\n")
        : "Nenhum lead em etapa avançada com score alto no momento.",
    severity: "info",
    evidence: [],
  });

  const stalled = openLeads.filter((lead) => {
    const daysInStage = daysInStageByLeadId.get(lead.id);
    const avg = stageAvgDaysByStageId.get(lead.stageId);
    return (
      daysInStage !== undefined && avg !== undefined && avg !== null && daysInStage > avg * 1.5
    );
  });
  drafts.push({
    type: "pipeline_parado",
    module: "comercial",
    contextRef: null,
    title: "Pipeline parado",
    content:
      stalled.length > 0
        ? `${stalled.length} lead(s) parado(s) acima do tempo médio da etapa: ${stalled
            .slice(0, 5)
            .map((l) => l.name)
            .join(", ")}${stalled.length > 5 ? "…" : ""}.`
        : "Nenhum lead está significativamente acima do tempo médio da sua etapa.",
    severity: stalled.length >= 3 ? "critico" : stalled.length > 0 ? "atencao" : "info",
    evidence: [{ label: "Leads em aberto", value: String(openLeads.length) }],
  });

  const avgScore =
    openLeads.length > 0
      ? Math.round(openLeads.reduce((sum, lead) => sum + lead.score, 0) / openLeads.length)
      : 0;
  const wonCount = leads.filter((lead) => lead.stage.isWon).length;
  const conversionRate = leads.length > 0 ? (wonCount / leads.length) * 100 : 0;
  drafts.push({
    type: "resumo_comercial",
    module: "comercial",
    contextRef: null,
    title: "Resumo comercial",
    content: `${openLeads.length} lead(s) em aberto, score médio ${avgScore}, ${wonCount} fechado(s) de ${leads.length} (conversão de ${conversionRate.toFixed(1)}%).`,
    severity: "info",
    evidence: [
      { label: "Leads em aberto", value: String(openLeads.length) },
      { label: "Conversão geral", value: `${conversionRate.toFixed(1)}%` },
    ],
  });

  return drafts;
}
