"use client";

import { useEffect, useRef } from "react";

const MAX_TILT = 6;

/** 3D tilt on hover, mirrors the original `[data-tilt]` mousemove effect. */
export function useTilt<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    function onMouseMove(e: MouseEvent) {
      if (!el) return;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty("--ry", `${(px * MAX_TILT * 2).toFixed(2)}deg`);
      el.style.setProperty("--rx", `${(-py * MAX_TILT * 2).toFixed(2)}deg`);
    }
    function onMouseLeave() {
      if (!el) return;
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
    }

    el.addEventListener("mousemove", onMouseMove);
    el.addEventListener("mouseleave", onMouseLeave);
    return () => {
      el.removeEventListener("mousemove", onMouseMove);
      el.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return ref;
}
