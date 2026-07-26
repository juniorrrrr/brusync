import { type AiSuggestionDraft, daysSince, formatCurrency } from "@/domain/ai/suggestionDraft";
import type { ClientWithOwner, CrmLeadWithRelations, MaterialDownload } from "@/types/crm";
import type { KnowledgeSearchResult } from "@/types/knowledge";
import type { Project } from "@/types/projects";

export interface LeadInsightsInput {
  lead: CrmLeadWithRelations;
  now: Date;
  stageAvgDays: number | null;
  daysInStage: number | null;
  materialDownloads: MaterialDownload[];
  relatedProjects: Project[];
  similarClients: ClientWithOwner[];
  knowledgeMatches: KnowledgeSearchResult[];
}

/** Assistente do Lead (Fase 26) — cada sugestão é derivada de dados já
 * carregados por services/ai/aiContextService.ts::buildLeadContext (CRM,
 * Projetos, Base de Conhecimento); nenhum número é inventado. "Probabilidade
 * de fechamento" é uma heurística simples (score do lead ponderado pela
 * posição no funil), não um modelo estatístico — documentado como tal no
 * relatório da fase. */
export function buildLeadInsights(input: LeadInsightsInput): AiSuggestionDraft[] {
  const {
    lead,
    now,
    stageAvgDays,
    daysInStage,
    materialDownloads,
    relatedProjects,
    similarClients,
    knowledgeMatches,
  } = input;
  const drafts: AiSuggestionDraft[] = [];
  const daysSinceContact = daysSince(lead.lastInteractionAt, now);
  const daysSinceCreated = daysSince(lead.createdAt, now) ?? 0;

  drafts.push({
    type: "resumo",
    module: "lead",
    contextRef: lead.id,
    title: "Resumo automático do lead",
    content: `${lead.name}${lead.company ? ` (${lead.company})` : ""} está na etapa "${lead.stage.label}" há ${daysInStage ?? daysSinceCreated} dia(s), com score ${lead.score} e valor potencial de ${lead.potentialValue !== null ? formatCurrency(lead.potentialValue) : "não informado"}. Responsável: ${lead.owner?.name ?? "sem responsável"}.`,
    severity: "info",
    evidence: [
      { label: "Etapa", value: lead.stage.label },
      { label: "Score", value: String(lead.score) },
      { label: "Responsável", value: lead.owner?.name ?? "—" },
    ],
  });

  const isStalled = daysSinceContact === null || daysSinceContact >= 3;
  drafts.push({
    type: "proxima_acao",
    module: "lead",
    contextRef: lead.id,
    title: "Próxima melhor ação",
    content: isStalled
      ? `Fazer contato agora — ${daysSinceContact !== null ? `já se passaram ${daysSinceContact} dia(s) desde a última interação` : "nenhuma interação foi registrada ainda"}.`
      : `Manter o ritmo atual de acompanhamento na etapa "${lead.stage.label}" — última interação há ${daysSinceContact} dia(s).`,
    severity: isStalled ? "atencao" : "info",
    evidence: [
      {
        label: "Última interação",
        value: lead.lastInteractionAt ? `${daysSinceContact} dia(s) atrás` : "nunca",
      },
    ],
  });

  const scoreWeight = Math.min(Math.max(lead.score, 0), 100);
  const stageWeight = Math.min(lead.stage.position * 15, 60);
  const probability = Math.min(Math.round(scoreWeight * 0.6 + stageWeight), 97);
  drafts.push({
    type: "probabilidade_fechamento",
    module: "lead",
    contextRef: lead.id,
    title: "Probabilidade de fechamento",
    content: `Estimativa de ${probability}% de fechamento, combinando o score do lead (${lead.score}) com o avanço no funil (etapa "${lead.stage.label}"). Esta é uma heurística, não um modelo preditivo.`,
    severity: probability >= 70 ? "info" : probability >= 40 ? "atencao" : "critico",
    evidence: [
      { label: "Score", value: String(lead.score) },
      { label: "Etapa", value: `${lead.stage.label} (posição ${lead.stage.position})` },
    ],
  });

  const risks: string[] = [];
  if (daysInStage !== null && stageAvgDays !== null && daysInStage > stageAvgDays * 1.5) {
    risks.push(
      `parado ${daysInStage} dia(s) na etapa atual, acima da média de ${stageAvgDays.toFixed(1)} dia(s)`,
    );
  }
  if (daysSinceContact === null || daysSinceContact >= 7) {
    risks.push("sem contato registrado há mais de uma semana");
  }
  if (lead.potentialValue !== null && lead.potentialValue > 0 && lead.score < 30) {
    risks.push("score baixo para um valor potencial relevante");
  }
  drafts.push({
    type: "risco",
    module: "lead",
    contextRef: lead.id,
    title: "Riscos encontrados",
    content:
      risks.length > 0
        ? risks.map((r) => `• ${r}`).join("\n")
        : "Nenhum risco relevante identificado no momento.",
    severity: risks.length >= 2 ? "critico" : risks.length === 1 ? "atencao" : "info",
    evidence: [],
  });

  drafts.push({
    type: "movimentacao",
    module: "lead",
    contextRef: lead.id,
    title: "Últimas movimentações importantes",
    content: `Criado há ${daysSinceCreated} dia(s). ${lead.lastInteractionAt ? `Última interação em ${new Date(lead.lastInteractionAt).toLocaleDateString("pt-BR")}.` : "Nenhuma interação registrada ainda."} Atualizado pela última vez em ${new Date(lead.updatedAt).toLocaleDateString("pt-BR")}.`,
    severity: "info",
    evidence: [],
  });

  const materials = materialDownloads.slice(0, 3).map((m) => m.materialTitle);
  const knowledgeTitles = knowledgeMatches.slice(0, 3).map((k) => k.title);
  const recommended = materials.length > 0 ? materials : knowledgeTitles;
  drafts.push({
    type: "material_recomendado",
    module: "lead",
    contextRef: lead.id,
    title: "Materiais recomendados",
    content:
      recommended.length > 0
        ? `Materiais relevantes para este lead: ${recommended.join(", ")}.`
        : "Nenhum material específico encontrado — considere indicar um conteúdo institucional geral.",
    severity: "info",
    evidence: [],
  });

  drafts.push({
    type: "projeto_relacionado",
    module: "lead",
    contextRef: lead.id,
    title: "Projetos relacionados",
    content:
      relatedProjects.length > 0
        ? `${relatedProjects.length} projeto(s) do mesmo cliente: ${relatedProjects.map((p) => p.name).join(", ")}.`
        : "Nenhum projeto vinculado ao cliente deste lead ainda.",
    severity: "info",
    evidence: [],
  });

  drafts.push({
    type: "cliente_semelhante",
    module: "lead",
    contextRef: lead.id,
    title: "Clientes semelhantes",
    content:
      similarClients.length > 0
        ? `Clientes com perfil parecido (mesma cidade ou origem): ${similarClients.map((c) => c.company).join(", ")}.`
        : "Nenhum cliente com perfil semelhante encontrado na base atual.",
    severity: "info",
    evidence: [],
  });

  return drafts;
}
