"use client";

import { useEffect } from "react";
import { captureAttribution } from "@/lib/tracking/capture";
import { applyClarityTags } from "@/lib/tracking/clarity";
import { applyAttributionUserProperties } from "@/lib/tracking/ga4";

/** Mounted once in the root layout. On every page load it captures
 * whatever UTMs/click ids/referrer are present (merging into the persisted
 * first/last-touch record — see lib/tracking/capture.ts), then enriches
 * GA4 and Clarity with that context. Runs once per mount (this site
 * navigates via full page loads, so "once per mount" already means "once
 * per page view") — no listeners, no polling, no re-renders: it renders
 * nothing. */
export function TrackingBootstrap() {
  useEffect(() => {
    const record = captureAttribution();
    applyAttributionUserProperties(record);
    applyClarityTags(record);
  }, []);

  return null;
}
