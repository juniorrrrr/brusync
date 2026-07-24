import type { AlertCandidate, InsightCandidate } from "@/domain/intelligence/rules";
import type { IntelligenceRecommendation } from "@/types/intelligence";

interface RecommendationTemplate {
  action: string;
  entityLabel: (evidenceLabel: string) => string;
}

/** Maps a rule key straight onto the recommendation the spec asks for
 * ("Priorizar Lead", "Revisar campanha", ...) — every recommendation is
 * derived 1:1 from an insight/alert that already passed its own rule
 * check, so nothing here invents a suggestion the data doesn't support. */
const TEMPLATES: Record<string, RecommendationTemplate> = {
  leads_parados: { action: "Priorizar contato com os leads parados", entityLabel: (l) => l },
  lead_sem_contato: {
    action: "Priorizar o lead e realizar o primeiro contato",
    entityLabel: (l) => l,
  },
  lead_parado_alerta: { action: "Agendar follow-up imediato", entityLabel: (l) => l },
  cliente_parado: { action: "Entrar em contato com o cliente", entityLabel: (l) => l },
  cliente_inadimplente: {
    action: "Entrar em contato com o cliente inadimplente",
    entityLabel: (l) => l,
  },
  pipeline_congestionado: {
    action: "Revisar e mover os leads parados nesta etapa",
    entityLabel: (l) => l,
  },
  projetos_atrasados: {
    action: "Concluir ou replanejar os projetos atrasados",
    entityLabel: (l) => l,
  },
  projeto_atrasado_alerta: { action: "Concluir o projeto atrasado", entityLabel: (l) => l },
  campanha_pior_roi: { action: "Revisar ou pausar a campanha", entityLabel: (l) => l },
  campanha_sem_conversao: { action: "Revisar a campanha sem conversões", entityLabel: (l) => l },
  campanha_gasto_elevado: { action: "Reduzir investimento na campanha", entityLabel: (l) => l },
  campanha_melhor_roi: {
    action: "Considerar aumentar o investimento na campanha",
    entityLabel: (l) => l,
  },
  falha_automacao: { action: "Revisar a automação com falhas recorrentes", entityLabel: (l) => l },
  responsavel_baixa_conversao: {
    action: "Apoiar o responsável com menor conversão",
    entityLabel: (l) => l,
  },
};

function fromCandidate(
  candidate: InsightCandidate | AlertCandidate,
  severity: InsightCandidate["severity"],
): IntelligenceRecommendation | null {
  const template = TEMPLATES[candidate.ruleKey];
  if (!template) return null;

  const firstEvidence = candidate.evidence[0];
  return {
    id: `${candidate.ruleKey}-${candidate.relatedEntityId ?? firstEvidence?.label ?? "geral"}`,
    category: candidate.category,
    title: template.action,
    reason: candidate.description,
    action: template.action,
    relatedEntityType: candidate.relatedEntityType,
    relatedEntityId: candidate.relatedEntityId,
    relatedEntityLabel: firstEvidence ? template.entityLabel(firstEvidence.label) : null,
    severity,
  };
}

export function generateRecommendations(
  insights: InsightCandidate[],
  alerts: AlertCandidate[],
): IntelligenceRecommendation[] {
  const fromInsights = insights
    .map((i) => fromCandidate(i, i.severity))
    .filter((r): r is IntelligenceRecommendation => r !== null);
  const fromAlerts = alerts
    .map((a) => fromCandidate(a, a.severity))
    .filter((r): r is IntelligenceRecommendation => r !== null);

  const severityOrder = { critico: 0, atencao: 1, info: 2 };
  return [...fromAlerts, ...fromInsights].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity],
  );
}
