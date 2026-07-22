import { clampScore, SCORE_TONE } from "@/domain/crm/leadRules";
import type { BadgeTone } from "@/types/crm";

/** Signals used to compute a lead's score. Deliberately simple, additive
 * rules for now ("regras simples") — kept as a single pure function so a
 * future ML-based scorer can replace just this computation without touching
 * any call site (application/crm/leadsActions.ts calls it after every event
 * that can move the needle: lead created/edited, stage change, interaction). */
export interface LeadScoreInputs {
  hasCompany: boolean;
  hasPhone: boolean;
  hasMaterialDownload: boolean;
  isQualifiedOrBeyond: boolean;
  daysInCurrentStage: number;
  hasInteraction: boolean;
}

export function computeLeadScore(inputs: LeadScoreInputs): number {
  let score = 0;
  if (inputs.hasCompany) score += 15;
  if (inputs.hasPhone) score += 10;
  if (inputs.hasMaterialDownload) score += 20;
  if (inputs.isQualifiedOrBeyond) score += 30;
  if (inputs.daysInCurrentStage > 15) score -= 20;
  if (!inputs.hasInteraction) score -= 15;
  return clampScore(score);
}

export type LeadPriority = "low" | "medium" | "high";

export function priorityFromScore(score: number): LeadPriority {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

export const LEAD_PRIORITY_LABEL: Record<LeadPriority, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
};

export function leadPriorityTone(score: number): BadgeTone {
  return SCORE_TONE(score);
}
