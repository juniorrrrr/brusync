import type { TrackingContext } from "./types";

/** Flat attribution columns shared by every lead-capturing table
 * (`leads`, `material_leads`, and any future one). Pure data shaping, no
 * I/O — safe to import from a "use server" action file to build an insert
 * payload, or from a client component just for the type. */
export interface AttributionInsertFields {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  gclid: string | null;
  fbclid: string | null;
  msclkid: string | null;
  ttclid: string | null;
  landing_page: string | null;
  referer: string | null;
  first_visit: string | null;
  last_visit: string | null;
  visitor_id: string | null;
  session_id: string | null;
  device: string | null;
  os: string | null;
  browser: string | null;
  language: string | null;
  timezone: string | null;
  user_agent: string | null;
}

/** Builds the attribution columns for an insert into `leads` or
 * `material_leads`. The last-touch campaign data (utm params, click ids)
 * is what's stored — what actually drove this conversion; landing_page and
 * referer come from the first touch of the whole visit. Falls back to a
 * server-observed value (e.g. the request's User-Agent header) when the
 * client-reported context is missing a field. */
export function buildAttributionInsertFields(
  context: TrackingContext,
  fallback: { userAgent?: string | null } = {},
): AttributionInsertFields {
  const { attribution, visitorId, sessionId, device, os, browser, language, timezone, userAgent } =
    context;
  const { firstTouch, lastTouch, firstVisitAt, lastVisitAt } = attribution;

  return {
    utm_source: lastTouch.utmSource ?? null,
    utm_medium: lastTouch.utmMedium ?? null,
    utm_campaign: lastTouch.utmCampaign ?? null,
    utm_content: lastTouch.utmContent ?? null,
    utm_term: lastTouch.utmTerm ?? null,
    gclid: lastTouch.gclid ?? null,
    fbclid: lastTouch.fbclid ?? null,
    msclkid: lastTouch.msclkid ?? null,
    ttclid: lastTouch.ttclid ?? null,
    landing_page: firstTouch.landingPage ?? null,
    referer: firstTouch.referrer ?? null,
    first_visit: firstVisitAt ?? null,
    last_visit: lastVisitAt ?? null,
    visitor_id: visitorId || null,
    session_id: sessionId || null,
    device: device || null,
    os: os || null,
    browser: browser || null,
    language: language || null,
    timezone: timezone || null,
    user_agent: userAgent || fallback.userAgent || null,
  };
}
