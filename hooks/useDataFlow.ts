"use client";

import { type RefObject, useEffect, useId } from "react";

const NS = "http://www.w3.org/2000/svg";
const CORE = { x: 580, y: 144 };
const SOURCE_X = [60, 220, 380, 480, 680, 780, 940, 1100];
const TRAIL_FRACTION = 0.16;

function bezier(p0: { x: number; y: number }, p1: { x: number; y: number }) {
  const midY = p0.y + (p1.y - p0.y) * 0.55;
  return `M ${p0.x} ${p0.y} C ${p0.x} ${midY}, ${p1.x} ${midY}, ${p1.x} ${p1.y}`;
}

interface DataFlowRefs {
  wrapRef: RefObject<HTMLDivElement | null>;
  linesRef: RefObject<SVGGElement | null>;
  particlesRef: RefObject<SVGGElement | null>;
}

interface FlowStream {
  path: SVGPathElement;
  len: number;
  t: number;
  speed: number;
  gradient: SVGLinearGradientElement;
  dot: SVGCircleElement;
}

/** Platforms converging into the Brusync core: a soft gradient "beam" and a
 * leading dot travel along the real SVG curves (`getPointAtLength`) toward a
 * single processing point. The base line itself stays static — only the
 * beam overlay animates. */
export function useDataFlow({ wrapRef, linesRef, particlesRef }: DataFlowRefs) {
  const uid = useId();

  useEffect(() => {
    const wrap = wrapRef.current;
    const linesG = linesRef.current;
    const particlesG = particlesRef.current;
    if (!wrap || !linesG || !particlesG) return;
    const svg = linesG.ownerSVGElement;
    if (!svg) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const defs = document.createElementNS(NS, "defs");
    svg.insertBefore(defs, linesG);
    const beamsG = document.createElementNS(NS, "g");
    beamsG.setAttribute("class", "df-beams");
    svg.insertBefore(beamsG, particlesG);

    const basePaths: SVGPathElement[] = SOURCE_X.map((x) => {
      const p = document.createElementNS(NS, "path");
      p.setAttribute("class", "df-path");
      p.setAttribute("d", bezier({ x, y: 0 }, CORE));
      linesG.appendChild(p);
      return p;
    });

    if (reduceMotion) {
      return () => {
        for (const el of basePaths) el.remove();
        beamsG.remove();
        defs.remove();
      };
    }

    const streams: FlowStream[] = basePaths.map((path, i) => {
      const len = path.getTotalLength();
      const color = Math.random() < 0.5 ? "#38BDF8" : "#1F5EFF";

      const gradient = document.createElementNS(NS, "linearGradient");
      gradient.setAttribute("id", `dfBeam-${uid}-${i}`);
      gradient.setAttribute("gradientUnits", "userSpaceOnUse");
      const stops: Array<[string, string, string]> = [
        ["0%", color, "0"],
        ["60%", color, "0.35"],
        ["100%", color, "0.9"],
      ];
      for (const [offset, stopColor, stopOpacity] of stops) {
        const stop = document.createElementNS(NS, "stop");
        stop.setAttribute("offset", offset);
        stop.setAttribute("stop-color", stopColor);
        stop.setAttribute("stop-opacity", stopOpacity);
        gradient.appendChild(stop);
      }
      defs.appendChild(gradient);

      const beam = document.createElementNS(NS, "path");
      beam.setAttribute("class", "df-beam");
      beam.setAttribute("d", path.getAttribute("d") ?? "");
      beam.setAttribute("stroke", `url(#dfBeam-${uid}-${i})`);
      beamsG.appendChild(beam);

      const dot = document.createElementNS(NS, "circle");
      dot.setAttribute("class", "df-particle");
      dot.setAttribute("r", "2.6");
      dot.setAttribute("fill", color);
      particlesG.appendChild(dot);

      return {
        path,
        len,
        t: Math.random(),
        speed: (1 / 3600) * (0.85 + Math.random() * 0.3),
        gradient,
        dot,
      };
    });

    let raf = 0;
    let running = false;
    let hidden = false;
    let lastTs: number | null = null;

    function frame(ts: number) {
      if (lastTs == null) lastTs = ts;
      const dt = Math.min(48, ts - lastTs);
      lastTs = ts;
      for (const s of streams) {
        s.t = (s.t + s.speed * dt) % 1;
        const lead = s.path.getPointAtLength(s.t * s.len);
        const tailT = Math.max(0, s.t - TRAIL_FRACTION);
        const tail = s.path.getPointAtLength(tailT * s.len);
        s.gradient.setAttribute("x1", String(tail.x));
        s.gradient.setAttribute("y1", String(tail.y));
        s.gradient.setAttribute("x2", String(lead.x));
        s.gradient.setAttribute("y2", String(lead.y));
        s.dot.setAttribute("cx", String(lead.x));
        s.dot.setAttribute("cy", String(lead.y));
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
      for (const el of basePaths) el.remove();
      beamsG.remove();
      defs.remove();
    };
  }, [wrapRef, linesRef, particlesRef, uid]);
}
