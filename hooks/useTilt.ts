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

    function applyTilt(clientX: number, clientY: number) {
      if (!el) return;
      const r = el.getBoundingClientRect();
      const px = (clientX - r.left) / r.width - 0.5;
      const py = (clientY - r.top) / r.height - 0.5;
      el.style.setProperty("--ry", `${(px * MAX_TILT * 2).toFixed(2)}deg`);
      el.style.setProperty("--rx", `${(-py * MAX_TILT * 2).toFixed(2)}deg`);
    }
    function resetTilt() {
      if (!el) return;
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
    }
    function onMouseMove(e: MouseEvent) {
      applyTilt(e.clientX, e.clientY);
    }

    // Touch has no hover/mousemove, so a press-and-hold on the card drives
    // the same tilt, releasing back to neutral on lift.
    function onTouchStart(e: TouchEvent) {
      const t = e.touches[0];
      if (t) applyTilt(t.clientX, t.clientY);
    }
    function onTouchMove(e: TouchEvent) {
      const t = e.touches[0];
      if (t) applyTilt(t.clientX, t.clientY);
    }

    el.addEventListener("mousemove", onMouseMove);
    el.addEventListener("mouseleave", resetTilt);
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", resetTilt);
    el.addEventListener("touchcancel", resetTilt);
    return () => {
      el.removeEventListener("mousemove", onMouseMove);
      el.removeEventListener("mouseleave", resetTilt);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", resetTilt);
      el.removeEventListener("touchcancel", resetTilt);
    };
  }, []);

  return ref;
}
