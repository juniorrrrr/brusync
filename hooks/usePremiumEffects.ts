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

    // Touch has no persistent hover, so a tap positions the spotlight glow
    // directly and holds it briefly instead of tracking continuous movement.
    let tapTimer: ReturnType<typeof setTimeout> | undefined;
    function onPointerDown(e: PointerEvent) {
      if (e.pointerType === "mouse") return;
      const el = (e.target as HTMLElement)?.closest<HTMLElement>("[data-spot]");
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
      el.classList.add("spot-tap");
      clearTimeout(tapTimer);
      tapTimer = setTimeout(() => el.classList.remove("spot-tap"), 900);
    }
    document.addEventListener("pointerdown", onPointerDown, { passive: true });

    const pulseInterval = window.setInterval(() => {
      const kpis = [...document.querySelectorAll<HTMLElement>(".kpi")];
      if (!kpis.length) return;
      const el = kpis[Math.floor(Math.random() * kpis.length)];
      el.classList.add("pulse");
      setTimeout(() => el.classList.remove("pulse"), 1000);
    }, 4200);

    return () => {
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerdown", onPointerDown);
      if (spotRaf) cancelAnimationFrame(spotRaf);
      clearTimeout(tapTimer);
      window.clearInterval(pulseInterval);
    };
  }, []);
}
