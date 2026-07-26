import type {
  AiContextType,
  AiSuggestionEvidence,
  AiSuggestionSeverity,
  AiSuggestionType,
} from "@/types/ai";

/** Formato que todo domain/ai/insights/*.ts builder devolve — o serviço
 * (services/ai/aiInsightsService.ts) é quem atribui id/createdAt/isFavorite
 * ao gravar o log em ai_suggestions (ou ao simplesmente exibir, em Modo
 * Demonstração). Nenhum builder toca o banco. */
export interface AiSuggestionDraft {
  type: AiSuggestionType;
  module: AiContextType;
  contextRef: string | null;
  title: string;
  content: string;
  severity: AiSuggestionSeverity;
  evidence: AiSuggestionEvidence[];
}

export function daysSince(iso: string | null, now: Date): number | null {
  if (!iso) return null;
  return Math.floor((now.getTime() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000));
}

export function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
