"use client";

import { type RefObject, useEffect } from "react";

const NS = "http://www.w3.org/2000/svg";
const CORE = { x: 600, y: 130 };
const DASH = { x: 1060, y: 240 };
const SOURCE_X = [97, 290, 483, 677, 870, 1063];

function bezier(p0: { x: number; y: number }, p1: { x: number; y: number }) {
  const midY = p0.y + (p1.y - p0.y) * 0.55;
  return `M ${p0.x} ${p0.y} C ${p0.x} ${midY}, ${p1.x} ${midY}, ${p1.x} ${p1.y}`;
}

interface DataFlowRefs {
  wrapRef: RefObject<HTMLDivElement | null>;
  linesRef: RefObject<SVGGElement | null>;
  particlesRef: RefObject<SVGGElement | null>;
  kpiRefs: RefObject<(HTMLSpanElement | null)[]>;
  barRefs: RefObject<(SVGRectElement | null)[]>;
}

interface FlowParticle {
  path: SVGPathElement;
  len: number;
  t: number;
  speed: number;
  el: SVGCircleElement;
  isOut: boolean;
}

/** Platforms → Brusync core → dashboard motion-path animation: particles
 * travel along real SVG curves (`getPointAtLength`) and pulse the mini
 * dashboard on arrival. */
export function useDataFlow({ wrapRef, linesRef, particlesRef, kpiRefs, barRefs }: DataFlowRefs) {
  useEffect(() => {
    const wrap = wrapRef.current;
    const linesG = linesRef.current;
    const particlesG = particlesRef.current;
    if (!wrap || !linesG || !particlesG) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const sources = SOURCE_X.map((x) => ({ x, y: 0 }));
    const paths: Array<{ el: SVGPathElement; isOut: boolean }> = [];

    sources.forEach((s, i) => {
      const p = document.createElementNS(NS, "path");
      p.setAttribute("class", "df-path");
      p.setAttribute("d", bezier(s, CORE));
      p.style.animationDelay = `${i * 0.12}s`;
      p.style.animationDuration = `${1.5 + Math.random() * 0.4}s`;
      linesG.appendChild(p);
      paths.push({ el: p, isOut: false });
    });
    const outPath = document.createElementNS(NS, "path");
    outPath.setAttribute("class", "df-path df-path-out");
    outPath.setAttribute("d", bezier(CORE, DASH));
    linesG.appendChild(outPath);
    paths.push({ el: outPath, isOut: true });

    if (reduceMotion) {
      return () => {
        for (const { el } of paths) el.remove();
      };
    }

    let lastTick = 0;
    function dashboardTick() {
      const now = performance.now();
      if (now - lastTick < 550) return;
      lastTick = now;
      const kpis = kpiRefs.current.filter((el): el is HTMLSpanElement => !!el);
      const kpi = kpis[Math.floor(Math.random() * kpis.length)];
      const box = kpi?.parentElement;
      if (box) {
        box.classList.add("tick");
        setTimeout(() => box.classList.remove("tick"), 450);
      }
      const bars = barRefs.current.filter((el): el is SVGRectElement => !!el);
      const bar = bars[Math.floor(Math.random() * bars.length)];
      if (bar) {
        const newH = 10 + Math.random() * 18;
        bar.setAttribute("height", newH.toFixed(1));
        bar.setAttribute("y", (34 - newH).toFixed(1));
      }
    }

    const particles: FlowParticle[] = [];
    for (const { el, isOut } of paths) {
      const len = el.getTotalLength();
      const dotCount = isOut ? 2 : 1;
      for (let i = 0; i < dotCount; i++) {
        const dot = document.createElementNS(NS, "circle");
        dot.setAttribute("class", "df-particle");
        dot.setAttribute("r", isOut ? "3.2" : "2.6");
        dot.setAttribute("fill", i % 2 ? "#25D0C3" : "#1F5EFF");
        particlesG.appendChild(dot);
        particles.push({
          path: el,
          len,
          t: Math.random(),
          speed: (isOut ? 1 / 4200 : 1 / 3600) * (0.85 + Math.random() * 0.3),
          el: dot,
          isOut,
        });
      }
    }

    let raf = 0;
    let running = false;
    let hidden = false;
    let lastTs: number | null = null;

    function frame(ts: number) {
      if (lastTs == null) lastTs = ts;
      const dt = Math.min(48, ts - lastTs);
      lastTs = ts;
      for (const pt of particles) {
        pt.t += pt.speed * dt;
        if (pt.t >= 1) {
          pt.t -= 1;
          if (pt.isOut) dashboardTick();
        }
        const pos = pt.path.getPointAtLength(pt.t * pt.len);
        pt.el.setAttribute("cx", String(pos.x));
        pt.el.setAttribute("cy", String(pos.y));
      }
      if (running) raf = requestAnimationFrame(frame);
    }
    function start() {
      if (running || hidden) return;
      running = true;
      lastTs = null;
      raf = requestAnimationFrame(frame);
    }
    function stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
    }

    function onVisibility() {
      hidden = document.hidden;
      if (hidden) stop();
      else start();
    }
    document.addEventListener("visibilitychange", onVisibility);
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) start();
          else stop();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(wrap);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
      io.disconnect();
      for (const { el } of paths) el.remove();
      for (const p of particles) p.el.remove();
    };
  }, [wrapRef, linesRef, particlesRef, kpiRefs, barRefs]);
}
