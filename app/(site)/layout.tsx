import type { ReactNode } from "react";
import { PremiumEffects } from "@/components/layout/PremiumEffects";

/** Ambient/cosmetic effects (spotlight hover, KPI pulse) only ever target
 * selectors used by the public site's marketing sections — scoped here so
 * the CRM never mounts a pointermove listener + interval for an effect it
 * has nothing to apply to. */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <PremiumEffects />
    </>
  );
}
