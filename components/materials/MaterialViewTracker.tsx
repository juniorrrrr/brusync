"use client";

import { useEffect } from "react";
import { applyClarityTags, EVENTS, getPersistedAttribution, trackEvent } from "@/lib/tracking";

export function MaterialViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    applyClarityTags(getPersistedAttribution(), { material: slug });
    trackEvent(EVENTS.MATERIAL_VIEW, { material_slug: slug });
  }, [slug]);

  return null;
}
