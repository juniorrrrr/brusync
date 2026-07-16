const VID_COOKIE = "bru_vid";
const FV_COOKIE = "bru_fv";
const LV_COOKIE = "bru_lv";
const COOKIE_MAX_AGE_DAYS = 365;

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string, days: number) {
  if (typeof document === "undefined") return;
  const maxAge = days * 24 * 60 * 60;
  // biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API isn't supported in Safari/Firefox yet
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getVisitorId(): string {
  let id = readCookie(VID_COOKIE);
  if (!id) {
    id = randomId();
    writeCookie(VID_COOKIE, id, COOKIE_MAX_AGE_DAYS);
  }
  return id;
}

export function getFirstVisit(): string {
  let fv = readCookie(FV_COOKIE);
  if (!fv) {
    fv = new Date().toISOString();
    writeCookie(FV_COOKIE, fv, COOKIE_MAX_AGE_DAYS);
  }
  return fv;
}

export function touchLastVisit(): string {
  const now = new Date().toISOString();
  writeCookie(LV_COOKIE, now, COOKIE_MAX_AGE_DAYS);
  return now;
}

export interface UtmParams {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
}

export function getUtms(): UtmParams {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  return {
    utmSource: params.get("utm_source") ?? undefined,
    utmMedium: params.get("utm_medium") ?? undefined,
    utmCampaign: params.get("utm_campaign") ?? undefined,
    utmTerm: params.get("utm_term") ?? undefined,
    utmContent: params.get("utm_content") ?? undefined,
  };
}

export interface UaInfo {
  device: string;
  os: string;
  browser: string;
}

export function parseUserAgent(ua: string): UaInfo {
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

export interface VisitorMeta extends UtmParams, UaInfo {
  visitorId: string;
  firstVisit: string;
  lastVisit: string;
  referer?: string;
  userAgent: string;
  language: string;
}

export function getVisitorMeta(): VisitorMeta {
  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "";
  return {
    visitorId: getVisitorId(),
    firstVisit: getFirstVisit(),
    lastVisit: touchLastVisit(),
    referer: typeof document !== "undefined" ? document.referrer || undefined : undefined,
    userAgent,
    language: typeof navigator !== "undefined" ? navigator.language : "",
    ...parseUserAgent(userAgent),
    ...getUtms(),
  };
}
