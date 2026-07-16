"use client";

import { useEffect } from "react";
import { MATERIAL_EVENTS, trackEvent } from "@/lib/tracking";

export function MaterialViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    trackEvent(MATERIAL_EVENTS.VIEW, { material_slug: slug });
  }, [slug]);

  return null;
}
