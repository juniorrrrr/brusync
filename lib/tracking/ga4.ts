import type { AttributionRecord } from "./types";

/** Attaches campaign/UTM context to gtag via `gtag('set', ...)` instead of
 * firing a manual "page_view" event: `set` values apply to every subsequent
 * hit in the page's lifetime (including the automatic page_view GA4 already
 * sends from the `gtag('config', ...)` call in the root layout), so this
 * enriches page_view, Google Ads, and every custom event without ever
 * double-counting page views. */
export function applyAttributionUserProperties(record: AttributionRecord) {
  if (typeof window === "undefined" || !window.gtag) return;

  const { lastTouch, firstTouch } = record;
  window.gtag("set", {
    campaign: {
      source: lastTouch.utmSource,
      medium: lastTouch.utmMedium,
      name: lastTouch.utmCampaign,
      content: lastTouch.utmContent,
      term: lastTouch.utmTerm,
    },
    page_referrer: firstTouch.referrer,
    landing_page: firstTouch.landingPage,
  });
}
