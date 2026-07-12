"use client";

import { useEffect } from "react";

/** Document-level effects that don't belong to a single section:
 * delegated spotlight hover on `[data-spot]` and periodic KPI pulse. */
export function usePremiumEffects() {
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    let spotRaf: number | null = null;
    let spotEvt: PointerEvent | null = null;
    function onPointerMove(e: PointerEvent) {
      spotEvt = e;
      if (spotRaf) return;
      spotRaf = requestAnimationFrame(() => {
        spotRaf = null;
        if (!spotEvt) return;
        for (const el of document.querySelectorAll<HTMLElement>("[data-spot]:hover")) {
          const r = el.getBoundingClientRect();
          el.style.setProperty("--mx", `${spotEvt.clientX - r.left}px`);
          el.style.setProperty("--my", `${spotEvt.clientY - r.top}px`);
        }
      });
    }
    document.addEventListener("pointermove", onPointerMove, { passive: true });

    const pulseInterval = window.setInterval(() => {
      const kpis = [...document.querySelectorAll<HTMLElement>(".kpi")];
      if (!kpis.length) return;
      const el = kpis[Math.floor(Math.random() * kpis.length)];
      el.classList.add("pulse");
      setTimeout(() => el.classList.remove("pulse"), 1000);
    }, 4200);

    return () => {
      document.removeEventListener("pointermove", onPointerMove);
      if (spotRaf) cancelAnimationFrame(spotRaf);
      window.clearInterval(pulseInterval);
    };
  }, []);
}
