"use client";

import { useEffect, useRef } from "react";
import { REVEAL_THRESHOLD } from "@/constants";
import { animateCount } from "@/lib/animateCount";

/** Reveals an element on scroll (IntersectionObserver) and animates any
 * nested `[data-target]` counters, mirroring the original vanilla reveal. */
export function useScrollReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      el.classList.add("in");
      for (const counter of el.querySelectorAll<HTMLElement>("[data-target]")) {
        animateCount(counter, true);
      }
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            for (const counter of entry.target.querySelectorAll<HTMLElement>("[data-target]")) {
              animateCount(counter, false);
            }
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: REVEAL_THRESHOLD },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}
