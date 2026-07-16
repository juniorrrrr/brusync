import { getPersistedAttribution } from "./capture";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    gtag?: (...args: unknown[]) => void;
    clarity?: (...args: unknown[]) => void;
  }
}

export const EVENTS = {
  GENERATE_LEAD: "generate_lead",
  CONTACT_SUBMIT: "contact_submit",
  MATERIAL_VIEW: "material_view",
  MATERIAL_MODAL_OPEN: "material_modal_open",
  MATERIAL_MODAL_CLOSE: "material_modal_close",
  MATERIAL_LEAD_START: "material_lead_start",
  MATERIAL_LEAD_SUBMIT: "material_lead_submit",
  MATERIAL_LEAD_REJECTED: "material_lead_rejected",
  MATERIAL_DOWNLOAD_START: "material_download_start",
  MATERIAL_DOWNLOAD_COMPLETE: "material_download_complete",
} as const;

export type TrackingEventName = (typeof EVENTS)[keyof typeof EVENTS];

/** Dispatches one event to GTM's dataLayer, direct gtag (GA4 + Google Ads)
 * and Microsoft Clarity, automatically attaching the persisted attribution
 * (utm_*, landing_page, referrer) so every event carries campaign context
 * without each call site having to pass it manually.
 *
 * Deliberately never used to fire a "page_view" — GA4 already sends that
 * automatically via `gtag('config', ...)`; see ga4.ts for how attribution
 * is attached to that automatic hit instead (avoids double counting). */
export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;

  const { lastTouch, firstTouch } = getPersistedAttribution();
  const enrichedParams = {
    utm_source: lastTouch.utmSource,
    utm_medium: lastTouch.utmMedium,
    utm_campaign: lastTouch.utmCampaign,
    utm_content: lastTouch.utmContent,
    utm_term: lastTouch.utmTerm,
    landing_page: firstTouch.landingPage,
    referrer: firstTouch.referrer,
    ...params,
  };

  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event: name, ...enrichedParams });

  window.gtag?.("event", name, enrichedParams);

  window.clarity?.("event", name);
}
