import { getPersistedAttribution } from "./capture";
import { getOrCreateSessionId, getOrCreateVisitorId, getTimezone, parseUserAgent } from "./helpers";
import type { TrackingContext } from "./types";

/** Assembles everything a form submission needs about the current visitor
 * in one call: persisted attribution, visitor/session ids, device info,
 * locale. This is the single object every form serializes into a hidden
 * field — no component should read cookies/localStorage/navigator itself. */
export function getTrackingContext(): TrackingContext {
  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "";

  return {
    attribution: getPersistedAttribution(),
    visitorId: getOrCreateVisitorId(),
    sessionId: getOrCreateSessionId(),
    language: typeof navigator !== "undefined" ? navigator.language : "",
    timezone: getTimezone(),
    userAgent,
    currentPage: typeof window !== "undefined" ? window.location.href : "",
    ...parseUserAgent(userAgent),
  };
}

export function serializeTrackingContext(): string {
  return JSON.stringify(getTrackingContext());
}

/** Safe-parses a tracking context JSON blob received from a form
 * submission. Returns null (rather than throwing) on malformed input so
 * callers can fall back gracefully — attribution is best-effort, it should
 * never block a legitimate lead from being saved. */
export function parseTrackingContext(raw: FormDataEntryValue | null): TrackingContext | null {
  if (typeof raw !== "string" || !raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !parsed.attribution) return null;
    return parsed as TrackingContext;
  } catch {
    return null;
  }
}
