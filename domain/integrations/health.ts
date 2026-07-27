/** Generic 0–100 health score from a recent window of sync outcomes — same
 * formula any future provider's sync engine can reuse instead of inventing
 * its own. A provider with too few recent runs to judge returns null
 * (matches `integrations.health_score`'s own "null enquanto não há dado
 * suficiente" contract from Fase 6). */
const MIN_SAMPLES_FOR_SCORE = 1;

export function computeHealthScore(recentOutcomes: ("success" | "error")[]): number | null {
  if (recentOutcomes.length < MIN_SAMPLES_FOR_SCORE) return null;
  const successes = recentOutcomes.filter((outcome) => outcome === "success").length;
  return Math.round((successes / recentOutcomes.length) * 100);
}
