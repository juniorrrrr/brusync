"use client";

import { useEffect, useRef } from "react";

interface ParticleFieldOptions {
  count: number;
  speed: number;
  color: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

/** Lightweight drifting-dots canvas background, used in the hero and CTA sections. */
export function useParticleField<T extends HTMLCanvasElement>(opts: ParticleFieldOptions) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      const host = canvas?.parentElement;
      if (!host || !canvas) return;
      w = host.offsetWidth;
      h = host.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    const points: Particle[] = Array.from({ length: opts.count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * opts.speed,
      vy: (Math.random() - 0.5) * opts.speed,
      r: Math.random() * 1.5 + 0.6,
    }));

    let hidden = false;
    function onVisibility() {
      hidden = document.hidden;
    }
    document.addEventListener("visibilitychange", onVisibility);

    let raf = 0;
    function frame() {
      if (!hidden && w && h && ctx) {
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = opts.color;
        for (const p of points) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0) p.x = w;
          if (p.x > w) p.x = 0;
          if (p.y < 0) p.y = h;
          if (p.y > h) p.y = 0;
          ctx.globalAlpha = 0.55;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [opts.count, opts.speed, opts.color]);

  return ref;
}
