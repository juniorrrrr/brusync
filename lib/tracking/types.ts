/** One marketing "touch": everything about the visit at the moment it was captured. */
export interface AttributionTouch {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  gclid?: string;
  fbclid?: string;
  msclkid?: string;
  ttclid?: string;
  landingPage: string;
  referrer?: string;
  timestamp: string;
}

/** Persisted, cross-page attribution record. `firstTouch` is frozen forever
 * once set (first-touch attribution); `lastTouch` only updates when a new
 * touch actually carries signal (a UTM/click id, or a genuinely external
 * referrer) — an internal, signal-less navigation never overwrites it. */
export interface AttributionRecord {
  firstTouch: AttributionTouch;
  lastTouch: AttributionTouch;
  firstVisitAt: string;
  lastVisitAt: string;
}

export interface DeviceInfo {
  device: string;
  os: string;
  browser: string;
}

/** Everything a form submission or event needs about the current visitor,
 * bundled once so every call site shares the exact same shape. */
export interface TrackingContext extends DeviceInfo {
  attribution: AttributionRecord;
  visitorId: string;
  sessionId: string;
  language: string;
  timezone: string;
  userAgent: string;
  currentPage: string;
}
