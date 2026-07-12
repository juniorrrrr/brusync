"use client";

import { useEffect, useRef } from "react";

/** Light scroll parallax on the hero dashboard mock. */
export function useHeroParallax<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    let ticking = false;
    function onScroll() {
      if (ticking || !el) return;
      ticking = true;
      requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const offset = Math.max(-22, Math.min(22, (rect.top - 160) * -0.035));
        el.style.transform = `translateY(${offset.toFixed(1)}px)`;
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return ref;
}
