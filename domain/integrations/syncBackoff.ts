/** Generic exponential backoff for any integration's sync job queue —
 * indexed by `attempts` (1 = failed once, ...). A job only becomes eligible
 * for retry once these minutes have passed since its last attempt. After
 * MAX_SYNC_ATTEMPTS, a job stays "falhou" until a manual reprocess.
 *
 * Originally Meta-Ads-specific (domain/metaAds/syncBackoff.ts, Fase 29) —
 * relocated here in Fase 34 since the logic never depended on Meta at all;
 * every future provider's sync queue reuses this same module instead of
 * reimplementing its own backoff curve. */
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
