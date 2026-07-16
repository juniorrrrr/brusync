import { describeOrigin } from "./helpers";
import type { AttributionRecord } from "./types";

/** Sets Microsoft Clarity custom tags so sessions can be filtered by
 * utm_source / utm_campaign / utm_medium / landing_page / origem, and
 * optionally by the material being viewed. Safe to call repeatedly — each
 * call just overwrites the tag with the current value. */
export function applyClarityTags(record: AttributionRecord, extra?: { material?: string }) {
  if (typeof window === "undefined" || !window.clarity) return;

  const { lastTouch, firstTouch } = record;
  const tags: Record<string, string> = {
    utm_source: lastTouch.utmSource ?? "",
    utm_campaign: lastTouch.utmCampaign ?? "",
    utm_medium: lastTouch.utmMedium ?? "",
    landing_page: firstTouch.landingPage,
    origem: describeOrigin(lastTouch),
  };
  if (extra?.material) tags.material = extra.material;

  for (const [key, value] of Object.entries(tags)) {
    if (value) window.clarity("set", key, value);
  }
}
