"use client";

import { usePremiumEffects } from "@/hooks/usePremiumEffects";

/** Mounts document-level ambient effects (spotlight hover, KPI pulse). Renders nothing. */
export function PremiumEffects() {
  usePremiumEffects();
  return null;
}
