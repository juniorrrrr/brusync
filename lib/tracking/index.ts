// Public API of the tracking & attribution engine. Every capture, event,
// and form submission in the app goes through this module — no component
// or service should read cookies/localStorage/gtag/clarity directly.

export { captureAttribution, getPersistedAttribution } from "./capture";
export { applyClarityTags } from "./clarity";
export { getTrackingContext, parseTrackingContext, serializeTrackingContext } from "./context";
export { EVENTS, trackEvent } from "./events";
export { applyAttributionUserProperties } from "./ga4";
export { describeOrigin, getOrCreateSessionId, getOrCreateVisitorId } from "./helpers";
export type { AttributionInsertFields } from "./supabase";
export { buildAttributionInsertFields } from "./supabase";
export type { AttributionRecord, AttributionTouch, DeviceInfo, TrackingContext } from "./types";
