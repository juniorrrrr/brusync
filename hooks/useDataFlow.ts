"use client";

import { type RefObject, useEffect } from "react";

const NS = "http://www.w3.org/2000/svg";
const CORE = { x: 580, y: 144 };
const SOURCE_X = [60, 220, 380, 480, 680, 780, 940, 1100];

function bezier(p0: { x: number; y: number }, p1: { x: number; y: number }) {
  const midY = p0.y + (p1.y - p0.y) * 0.55;
  return `M ${p0.x} ${p0.y} C ${p0.x} ${midY}, ${p1.x} ${midY}, ${p1.x} ${p1.y}`;
}

interface DataFlowRefs {
  wrapRef: RefObject<HTMLDivElement | null>;
  linesRef: RefObject<SVGGElement | null>;
  particlesRef: RefObject<SVGGElement | null>;
}

interface FlowParticle {
  path: SVGPathElement;
  len: number;
  t: number;
  speed: number;
  el: SVGCircleElement;
}

/** Platforms converging into the Brusync core: particles travel along real
 * SVG curves (`getPointAtLength`) toward a single processing point. */
export function useDataFlow({ wrapRef, linesRef, particlesRef }: DataFlowRefs) {
  useEffect(() => {
    const wrap = wrapRef.current;
    const linesG = linesRef.current;
    const particlesG = particlesRef.current;
    if (!wrap || !linesG || !particlesG) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const paths: SVGPathElement[] = SOURCE_X.map((x, i) => {
      const p = document.createElementNS(NS, "path");
      p.setAttribute("class", "df-path");
      p.setAttribute("d", bezier({ x, y: 0 }, CORE));
      p.style.animationDelay = `${i * 0.12}s`;
      p.style.animationDuration = `${1.5 + Math.random() * 0.4}s`;
      linesG.appendChild(p);
      return p;
    });

    if (reduceMotion) {
      return () => {
        for (const el of paths) el.remove();
      };
    }

    const particles: FlowParticle[] = [];
    for (const path of paths) {
      const len = path.getTotalLength();
      const dot = document.createElementNS(NS, "circle");
      dot.setAttribute("class", "df-particle");
      dot.setAttribute("r", "2.6");
      dot.setAttribute("fill", Math.random() < 0.5 ? "#25D0C3" : "#1F5EFF");
      particlesG.appendChild(dot);
      particles.push({
        path,
        len,
        t: Math.random(),
        speed: (1 / 3600) * (0.85 + Math.random() * 0.3),
        el: dot,
      });
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
        pt.t = (pt.t + pt.speed * dt) % 1;
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
      for (const el of paths) el.remove();
      for (const p of particles) p.el.remove();
    };
  }, [wrapRef, linesRef, particlesRef]);
}
