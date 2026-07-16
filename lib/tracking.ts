declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    gtag?: (...args: unknown[]) => void;
    clarity?: (...args: unknown[]) => void;
  }
}

export const MATERIAL_EVENTS = {
  VIEW: "material_view",
  MODAL_OPEN: "material_modal_open",
  MODAL_CLOSE: "material_modal_close",
  LEAD_START: "material_lead_start",
  LEAD_SUBMIT: "material_lead_submit",
  LEAD_REJECTED: "material_lead_rejected",
  DOWNLOAD_START: "material_download_start",
  DOWNLOAD_COMPLETE: "material_download_complete",
} as const;

export type MaterialEventName = (typeof MATERIAL_EVENTS)[keyof typeof MATERIAL_EVENTS];

/** Dispatches one event to GTM's dataLayer, direct gtag (GA4 + Google Ads)
 * and Microsoft Clarity, using a single consistent event name/params shape. */
export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event: name, ...params });

  window.gtag?.("event", name, params);

  window.clarity?.("event", name);
}
