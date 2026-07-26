/** Mesmo espírito do BACKOFF_MINUTES_BY_ATTEMPTS de
 * app/api/cron/meta-retry/route.ts (Fase 8) — indexado por `attempts` (1 =
 * falhou uma vez, ...). Um job só fica elegível para nova tentativa depois
 * que esses minutos passarem da última tentativa. Depois de MAX_ATTEMPTS,
 * o job fica "falhou" até um reprocessamento manual (Meta Ads →
 * Configurações → "Reprocessar"). */
export const MAX_SYNC_ATTEMPTS = 5;

const BACKOFF_MINUTES_BY_ATTEMPTS: Record<number, number> = {
  1: 1,
  2: 5,
  3: 30,
  4: 120,
  5: 360,
};

export function backoffMinutesForAttempt(attempts: number): number {
  return BACKOFF_MINUTES_BY_ATTEMPTS[attempts] ?? 360;
}

export function nextAttemptAt(attempts: number, from: Date = new Date()): Date {
  const minutes = backoffMinutesForAttempt(attempts);
  return new Date(from.getTime() + minutes * 60_000);
}
