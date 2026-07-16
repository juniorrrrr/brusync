import { readCookie, writeCookie } from "./cookies";
import { getItem, getSessionItem, setItem, setSessionItem } from "./storage";
import type { DeviceInfo } from "./types";

const VISITOR_ID_KEY = "bru_visitor_id";
const LEGACY_VISITOR_ID_COOKIE = "bru_vid"; // pre-existing cookie name, migrated in place
const SESSION_ID_KEY = "bru_session_id";

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Long-lived visitor id (localStorage + cookie fallback). Migrates the
 * legacy cookie-only id in place so returning visitors keep the same id. */
export function getOrCreateVisitorId(): string {
  const existing = getItem(VISITOR_ID_KEY);
  if (existing) return existing;

  const legacy = readCookie(LEGACY_VISITOR_ID_COOKIE);
  const id = legacy ?? randomId();
  setItem(VISITOR_ID_KEY, id);
  return id;
}

/** Session id, cleared when the browser/tab closes (sessionStorage, with a
 * session cookie — no max-age — as fallback). */
export function getOrCreateSessionId(): string {
  const existing = getSessionItem(SESSION_ID_KEY) ?? readCookie(SESSION_ID_KEY);
  if (existing) return existing;

  const id = randomId();
  setSessionItem(SESSION_ID_KEY, id);
  writeCookie(SESSION_ID_KEY, id, null);
  return id;
}

export function parseUserAgent(ua: string): DeviceInfo {
  const isTablet = /iPad|Tablet|(Android(?!.*Mobile))/i.test(ua);
  const isMobile = !isTablet && /Mobi|iPhone|Android/i.test(ua);
  const device = isTablet ? "tablet" : isMobile ? "mobile" : "desktop";

  let os = "Desconhecido";
  if (/Windows/i.test(ua)) os = "Windows";
  else if (/Mac OS X/i.test(ua) && !/iPhone|iPad/i.test(ua)) os = "macOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/Linux/i.test(ua)) os = "Linux";

  let browser = "Desconhecido";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/OPR\/|Opera/i.test(ua)) browser = "Opera";
  else if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) browser = "Chrome";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";
  else if (/Safari\//i.test(ua) && /Version\//i.test(ua)) browser = "Safari";

  return { device, os, browser };
}

export function getTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "";
  }
}

/** Human-readable attribution label for dashboards/Clarity filters, e.g.
 * "google / cpc", "google (ads click)", or "direto". */
export function describeOrigin(touch: {
  utmSource?: string;
  utmMedium?: string;
  gclid?: string;
  fbclid?: string;
}): string {
  if (touch.utmSource)
    return touch.utmMedium ? `${touch.utmSource} / ${touch.utmMedium}` : touch.utmSource;
  if (touch.gclid) return "google (ads click)";
  if (touch.fbclid) return "meta (ads click)";
  return "direto";
}
