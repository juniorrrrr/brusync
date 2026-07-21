import type { CrmLeadWithRelations } from "@/types/crm";

/** A lead is "aguardando contato" while it's still in the first stage of the
 * pipeline and nobody has logged an interaction with it yet — used by the
 * dashboard's "Leads aguardando contato" panel and by the Leads table's
 * default sort. */
export function isAwaitingContact(lead: CrmLeadWithRelations) {
  return lead.stage.position === 1 && !lead.lastInteractionAt;
}

export function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export const SCORE_TONE = (score: number): "ok" | "warn" | "danger" => {
  if (score >= 70) return "ok";
  if (score >= 40) return "warn";
  return "danger";
};
