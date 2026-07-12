"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  angVel: number;
  ring: number;
  z: number;
  size: number;
  color: string;
  phase: "in" | "orbit" | "out";
  life: number;
  fade: number;
  orbitLife: number;
  wavePhase: number;
  speed: number;
}

const CFG = {
  magnetRadius: 7,
  ringRadius: 8,
  particleSize: 1.3,
  lerpSpeed: 0.04,
  waveSpeed: 0.35,
  waveAmplitude: 0.6,
  particleVariance: 0.4,
  rotationSpeed: 0.03,
  depthFactor: 0.5,
  pulseSpeed: 2,
  fieldStrength: 12,
  colors: ["#1F5EFF", "#25D0C3"],
};

function countForWidth(width: number) {
  return width < 640 ? 150 : width < 1024 ? 300 : 450;
}

/** Data-convergence particle field: platform badges (`.ag-badge`) act as
 * sources that emit particles which orbit the central Brusync core. */
export function useAntigravityField(fieldRef: React.RefObject<HTMLDivElement | null>) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const field = fieldRef.current;
    const canvas = canvasRef.current;
    if (!field || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const badgeEls = [...field.querySelectorAll<HTMLElement>(".ag-badge")].filter(
      (el) => getComputedStyle(el).display !== "none",
    );
    const count = reduceMotion ? 0 : countForWidth(window.innerWidth);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let w = 0;
    let h = 0;
    let cx = 0;
    let cy = 0;
    let unit = 0;
    let sources: Array<{ x: number; y: number }> = [];

    function roundRectPath(x: number, y: number, rw: number, rh: number, r: number) {
      if (!ctx) return;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + rw, y, x + rw, y + rh, r);
      ctx.arcTo(x + rw, y + rh, x, y + rh, r);
      ctx.arcTo(x, y + rh, x, y, r);
      ctx.arcTo(x, y, x + rw, y, r);
      ctx.closePath();
    }

    function measure() {
      if (!field || !canvas || !ctx) return;
      const fr = field.getBoundingClientRect();
      w = fr.width;
      h = fr.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = w / 2;
      cy = h / 2;
      unit = Math.min(w, h) / (CFG.ringRadius * 2.6);
      sources = badgeEls.map((el) => {
        const r = el.getBoundingClientRect();
        return { x: r.left - fr.left + r.width / 2, y: r.top - fr.top + r.height / 2 };
      });
    }
    measure();
    window.addEventListener("resize", measure);

    function spawn(p: Partial<Particle>): Particle {
      const src = sources.length
        ? sources[Math.floor(Math.random() * sources.length)]
        : { x: cx, y: cy };
      const variance = 1 + (Math.random() * 2 - 1) * CFG.particleVariance;
      p.x = src.x;
      p.y = src.y;
      p.vx = 0;
      p.vy = 0;
      p.angle = Math.random() * Math.PI * 2;
      p.angVel = CFG.rotationSpeed * 0.05 * (Math.random() < 0.5 ? 1 : -1) * variance;
      p.ring = CFG.ringRadius * unit * (0.7 + Math.random() * 0.55);
      p.z = Math.random() * 2 - 1;
      p.size = CFG.particleSize * (1 + p.z * CFG.depthFactor) * Math.max(0.5, variance);
      p.color = CFG.colors[Math.floor(Math.random() * CFG.colors.length)];
      p.phase = "in";
      p.life = 0;
      p.fade = 0;
      p.orbitLife = 4 + Math.random() * 6;
      p.wavePhase = Math.random() * Math.PI * 2;
      p.speed = Math.max(0.4, variance);
      return p as Particle;
    }

    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) particles.push(spawn({}));

    let t = 0;
    let raf = 0;
    let running = false;
    let hidden = false;

    function frame() {
      if (!ctx) return;
      t += 0.016 * CFG.waveSpeed;
      ctx.clearRect(0, 0, w, h);
      const magnet = CFG.magnetRadius * unit;
      for (const p of particles) {
        p.life += 0.016;
        if (p.phase === "in") {
          p.angle += p.angVel * 2;
          const tx = cx + Math.cos(p.angle) * p.ring;
          const ty = cy + Math.sin(p.angle) * p.ring;
          const dx = tx - p.x;
          const dy = ty - p.y;
          const dist = Math.hypot(dx, dy) || 1;
          p.vx += (dx / dist) * CFG.fieldStrength * 0.002 * p.speed;
          p.vy += (dy / dist) * CFG.fieldStrength * 0.002 * p.speed;
          const wob = Math.sin(t + p.wavePhase) * CFG.waveAmplitude;
          p.vx += (-dy / dist) * wob * 0.05;
          p.vy += (dx / dist) * wob * 0.05;
          p.vx *= 0.9;
          p.vy *= 0.9;
          p.x += p.vx * CFG.lerpSpeed * 40;
          p.y += p.vy * CFG.lerpSpeed * 40;
          if (dist < magnet * 0.6) p.phase = "orbit";
        } else if (p.phase === "orbit") {
          p.angle += p.angVel;
          const breathe = Math.sin(t * CFG.pulseSpeed + p.wavePhase) * unit * 0.05;
          const r = p.ring + breathe;
          const nx = cx + Math.cos(p.angle) * r;
          const ny = cy + Math.sin(p.angle) * r;
          p.vx = nx - p.x;
          p.vy = ny - p.y;
          p.x = nx;
          p.y = ny;
          if (p.life > p.orbitLife) p.phase = "out";
        } else {
          p.fade += 0.02;
          if (p.fade >= 1) Object.assign(p, spawn(p));
        }
        const speed = Math.hypot(p.vx, p.vy);
        const ang = speed > 0.01 ? Math.atan2(p.vy, p.vx) : p.angle;
        const len = p.size * (2.2 + Math.min(speed * 2, 2.2));
        const alpha = p.phase === "out" ? Math.max(0, 1 - p.fade) : 0.5 + 0.35 * (0.5 + 0.5 * p.z);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(ang);
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx.fillStyle = p.color;
        roundRectPath(-len / 2, -p.size / 2, len, p.size, p.size / 2);
        ctx.fill();
        ctx.restore();
      }
      if (running) raf = requestAnimationFrame(frame);
    }

    function renderStatic() {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      const n = 60;
      for (let i = 0; i < n; i++) {
        const ang = (i / n) * Math.PI * 2;
        const r = CFG.ringRadius * unit * 0.9;
        const x = cx + Math.cos(ang) * r;
        const y = cy + Math.sin(ang) * r;
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = CFG.colors[i % 2];
        roundRectPath(
          x - CFG.particleSize,
          y - CFG.particleSize / 2,
          CFG.particleSize * 2,
          CFG.particleSize,
          CFG.particleSize / 2,
        );
        ctx.fill();
      }
    }

    function start() {
      if (running || hidden || reduceMotion) return;
      running = true;
      raf = requestAnimationFrame(frame);
    }
    function stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
    }

    if (reduceMotion) {
      renderStatic();
      return () => window.removeEventListener("resize", measure);
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
    io.observe(field);

    return () => {
      stop();
      window.removeEventListener("resize", measure);
      document.removeEventListener("visibilitychange", onVisibility);
      io.disconnect();
    };
  }, [fieldRef]);

  return canvasRef;
}
