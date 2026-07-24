import type {
  IntelligenceCategory,
  IntelligenceScoreCategory,
  IntelligenceSeverity,
  IntelligenceTrendDirection,
} from "@/types/intelligence";

export const INTELLIGENCE_CATEGORIES: IntelligenceCategory[] = [
  "comercial",
  "marketing",
  "financeiro",
  "projetos",
  "atendimento",
  "operacional",
];

export const INTELLIGENCE_CATEGORY_LABEL: Record<IntelligenceCategory, string> = {
  comercial: "Comercial",
  marketing: "Marketing",
  financeiro: "Financeiro",
  projetos: "Projetos",
  atendimento: "Atendimento",
  operacional: "Operacional",
};

export const INTELLIGENCE_SCORE_CATEGORIES: IntelligenceScoreCategory[] = [
  "comercial",
  "marketing",
  "financeiro",
  "operacional",
  "atendimento",
  "geral",
];

export const INTELLIGENCE_SCORE_CATEGORY_LABEL: Record<IntelligenceScoreCategory, string> = {
  comercial: "Comercial",
  marketing: "Marketing",
  financeiro: "Financeiro",
  operacional: "Operacional",
  atendimento: "Atendimento",
  geral: "Geral da Empresa",
};

export const INTELLIGENCE_SEVERITIES: IntelligenceSeverity[] = ["info", "atencao", "critico"];

export const INTELLIGENCE_SEVERITY_LABEL: Record<IntelligenceSeverity, string> = {
  info: "Informativo",
  atencao: "Atenção",
  critico: "Crítico",
};

/** Same "info/warn/ok/neutral/danger" badge vocabulary used across every
 * other module's crm-badge classes. */
export function intelligenceSeverityBadge(severity: IntelligenceSeverity): string {
  switch (severity) {
    case "critico":
      return "danger";
    case "atencao":
      return "warn";
    default:
      return "info";
  }
}

/** Badge color for a trend — driven by favorable (does this movement help
 * the business), never by raw direction alone, since "subindo" is good news
 * for receita but bad news for CAC. */
export function intelligenceTrendBadge(
  direction: IntelligenceTrendDirection,
  favorable: boolean,
): string {
  if (direction === "estavel") return "neutral";
  return favorable ? "ok" : "danger";
}

export function scoreBadge(score: number): string {
  if (score >= 75) return "ok";
  if (score >= 50) return "warn";
  return "danger";
}
