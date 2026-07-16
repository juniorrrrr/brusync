import { getJsonItem, setJsonItem } from "./storage";
import type { AttributionRecord, AttributionTouch } from "./types";

const ATTRIBUTION_KEY = "bru_attribution";

const CLICK_ID_PARAMS = ["gclid", "fbclid", "msclkid", "ttclid"] as const;
const UTM_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

/** All exported functions in this module touch window/document/storage, so
 * they must only ever run client-side. Client Components still render once
 * on the server for the initial HTML pass, so a lazy useState initializer
 * or top-level render call could reach this before hydration — guard with
 * a safe, empty-but-valid record rather than throwing. Real call sites
 * should compute this inside useEffect (post-mount), matching the rest of
 * the codebase's pattern. */
function emptyRecord(): AttributionRecord {
  const now = new Date(0).toISOString();
  const touch: AttributionTouch = { landingPage: "", timestamp: now };
  return { firstTouch: touch, lastTouch: touch, firstVisitAt: now, lastVisitAt: now };
}

function readCurrentTouch(): AttributionTouch {
  const params = new URLSearchParams(window.location.search);

  return {
    utmSource: params.get("utm_source") ?? undefined,
    utmMedium: params.get("utm_medium") ?? undefined,
    utmCampaign: params.get("utm_campaign") ?? undefined,
    utmContent: params.get("utm_content") ?? undefined,
    utmTerm: params.get("utm_term") ?? undefined,
    gclid: params.get("gclid") ?? undefined,
    fbclid: params.get("fbclid") ?? undefined,
    msclkid: params.get("msclkid") ?? undefined,
    ttclid: params.get("ttclid") ?? undefined,
    landingPage: window.location.href,
    referrer: document.referrer || undefined,
    timestamp: new Date().toISOString(),
  };
}

/** True when a touch carries real marketing signal: a UTM/click id, or a
 * referrer from outside this site. A plain internal navigation (no query
 * params, referrer is our own origin) has none of these. */
function hasSignal(touch: AttributionTouch): boolean {
  const hasUtmOrClickId = [...UTM_PARAMS, ...CLICK_ID_PARAMS].some((key) => {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase()) as keyof AttributionTouch;
    return Boolean(touch[camelKey]);
  });
  if (hasUtmOrClickId) return true;

  if (touch.referrer) {
    try {
      const referrerHost = new URL(touch.referrer).hostname;
      if (referrerHost && referrerHost !== window.location.hostname) return true;
    } catch {
      // malformed referrer, ignore
    }
  }
  return false;
}

/** Captures the current page's attribution touch and merges it into the
 * persisted record: first-touch is frozen forever, last-touch only updates
 * when the current touch has real signal, last-visit timestamp always
 * advances. Safe to call on every page load — idempotent and cheap (a
 * single synchronous read of the URL + one storage read/write). */
export function captureAttribution(): AttributionRecord {
  if (typeof window === "undefined") return emptyRecord();

  const current = readCurrentTouch();
  const now = current.timestamp;
  const existing = getJsonItem<AttributionRecord>(ATTRIBUTION_KEY);

  const record: AttributionRecord = existing
    ? {
        firstTouch: existing.firstTouch,
        lastTouch: hasSignal(current) ? current : existing.lastTouch,
        firstVisitAt: existing.firstVisitAt,
        lastVisitAt: now,
      }
    : {
        firstTouch: current,
        lastTouch: current,
        firstVisitAt: now,
        lastVisitAt: now,
      };

  setJsonItem(ATTRIBUTION_KEY, record);
  return record;
}

/** Reads the persisted record without mutating it, capturing it first if
 * this is the very first read of the session (e.g. a form mounted before
 * the tracking bootstrap effect ran). */
export function getPersistedAttribution(): AttributionRecord {
  if (typeof window === "undefined") return emptyRecord();
  return getJsonItem<AttributionRecord>(ATTRIBUTION_KEY) ?? captureAttribution();
}
