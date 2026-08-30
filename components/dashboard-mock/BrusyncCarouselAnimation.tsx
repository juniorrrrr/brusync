"use client";

import { Archivo } from "next/font/google";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-archivo-carousel",
  display: "swap",
});

/* ---------- tween helpers ---------- */

const Easing = {
  linear: (t: number) => t,
  easeOutCubic: (t: number) => --t * t * t + 1,
  easeInOutQuart: (t: number) => (t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t),
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

type Tween = {
  from?: number;
  to?: number;
  start?: number;
  end?: number;
  ease?: (t: number) => number;
};

function animate({ from = 0, to = 1, start = 0, end = 1, ease = Easing.linear }: Tween) {
  return (t: number) => {
    if (t <= start) return from;
    if (t >= end) return to;
    return from + (to - from) * ease((t - start) / (end - start));
  };
}

const MOTION = {
  enter: (o: Tween) => animate({ ease: Easing.easeOutCubic, ...o }),
  slide: (o: Tween) => animate({ ease: Easing.easeInOutQuart, ...o }),
  drift: (o: Tween) => animate({ ease: Easing.linear, ...o }),
};

/* ---------- scene timeline ---------- */
// Every authored scene runs at its own natural duration, so authored time T
// tracks elapsed time 1:1 — no warp step is needed here.
const SCENES: Array<{ name: string; dur: number }> = [
  { name: "Tela1", dur: 3.2 },
  { name: "Tela2", dur: 3.2 },
  { name: "Tela3", dur: 3.2 },
  { name: "Tela4", dur: 3.2 },
  { name: "Volta", dur: 2.6 },
];

function deriveCues(scenes: Array<{ name: string; dur: number }>) {
  const cues: Record<string, number> = {};
  let cursor = 0;
  for (const scene of scenes) {
    if (!(scene.name in cues)) cues[scene.name] = cursor;
    cursor += scene.dur;
  }
  return { cues, total: cursor };
}

const { cues: CUES, total: TOTAL_DURATION } = deriveCues(SCENES);

const BRAND = "Brusync";

const C = {
  bg: "#f3f2f2",
  ink: "#201e1d",
  dim: "#6f6763",
  rule: "#cfcac7",
  accent: "#0000ff",
};

type Slide = { src: string; cue: string; title: string; benefit: string };

const SLIDES: Slide[] = [
  {
    src: "/carousel-brusync/dashboard-operacional.png",
    cue: "Tela1",
    title: "Dashboard operacional",
    benefit: "Pedidos, clientes e tráfego num painel só seu.",
  },
  {
    src: "/carousel-brusync/analises-detalhadas.png",
    cue: "Tela2",
    title: "Análises detalhadas",
    benefit: "Receita, saldo e metas cruzados em tempo real.",
  },
  {
    src: "/carousel-brusync/gestao-financeira.png",
    cue: "Tela3",
    title: "Gestão financeira",
    benefit: "Fluxo de caixa, contas e DRE sem planilha paralela.",
  },
  {
    src: "/carousel-brusync/gestao-pessoas.png",
    cue: "Tela4",
    title: "Gestão de pessoas",
    benefit: "Quadro, admissões e desempenho no seu ambiente.",
  },
];

const FRAME = { x: 96, y: 100, w: 1408, h: 628 };
// Fixed CSS-pixel width of one slide's image box on the 1600-wide virtual
// canvas — constant regardless of viewport, since the whole stage scales as
// one unit via `transform: scale()` rather than reflowing. Each slide is
// `100/N`% of a flex row that is itself `N*100`% of FRAME.w, so the two
// factors cancel out and every slide box is exactly FRAME.w wide.
const SLIDE_IMAGE_SIZES = `${FRAME.w}px`;

function CarouselWindow({ T }: { T: number }) {
  const n = SLIDES.length;
  let advance = 0;
  for (let i = 1; i < n; i++) {
    const c = CUES[SLIDES[i].cue];
    advance += MOTION.slide({ from: 0, to: 1, start: c - 0.5, end: c + 0.5 })(T);
  }
  const back = MOTION.slide({ from: 0, to: 1, start: CUES.Volta - 0.1, end: CUES.Volta + 1.4 })(T);
  const pos = advance - back * (n - 1);

  const intro = MOTION.enter({ from: 0, to: 1, start: 0.1, end: 1.0 })(T);
  const introY = (1 - intro) * 30;

  const zoom = SLIDES.map((s, i) => {
    if (i === 0) {
      return (
        MOTION.drift({ from: 0.965, to: 1.0, start: 0, end: CUES[SLIDES[1].cue] + 0.6 })(T) -
        MOTION.drift({ from: 0, to: 0.035, start: CUES.Volta - 0.8, end: TOTAL_DURATION })(T)
      );
    }
    const c = CUES[s.cue];
    const nx = i + 1 < SLIDES.length ? CUES[SLIDES[i + 1].cue] : CUES.Volta + 1.4;
    return MOTION.drift({ from: 0.965, to: 1.0, start: c - 0.5, end: nx + 0.5 })(T);
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: C.bg,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.6,
          backgroundImage:
            "linear-gradient(#e6e3e1 2px, transparent 2px), linear-gradient(90deg, #e6e3e1 2px, transparent 2px)",
          backgroundSize: "80px 80px",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 96,
          right: 96,
          top: 40,
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          opacity: intro,
          transform: `translateY(${introY}px)`,
        }}
      >
        <div style={{ fontSize: 30, fontWeight: 700, color: C.ink, letterSpacing: "-0.01em" }}>
          {BRAND}
          <span style={{ color: C.accent }}>.</span>
        </div>
        <div
          style={{
            fontSize: 13,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: C.dim,
          }}
        >
          Sistemas sob medida · white label
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 96,
          right: 96,
          top: 82,
          height: 2,
          background: C.ink,
          opacity: intro,
          transform: `scaleX(${intro})`,
          transformOrigin: "left",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: FRAME.x,
          top: FRAME.y,
          width: FRAME.w,
          height: FRAME.h,
          overflow: "hidden",
          border: `2px solid ${C.rule}`,
          background: "#fff",
          opacity: intro,
          transform: `translateY(${introY}px)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            width: `${SLIDES.length * 100}%`,
            transform: `translateX(${-pos * (100 / SLIDES.length)}%)`,
          }}
        >
          {SLIDES.map((s, i) => (
            <div
              key={s.src}
              style={{
                width: `${100 / SLIDES.length}%`,
                height: "100%",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  transform: `scale(${zoom[i]})`,
                  transformOrigin: "50% 50%",
                }}
              >
                <Image
                  src={s.src}
                  alt=""
                  fill
                  sizes={SLIDE_IMAGE_SIZES}
                  style={{ objectFit: "contain" }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 96,
          right: 96,
          top: FRAME.y + FRAME.h + 26,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 40,
        }}
      >
        <div style={{ position: "relative", flex: 1, minWidth: 0, height: 96 }}>
          {SLIDES.map((s, i) => {
            const near = 1 - Math.min(1, Math.abs(pos - i) * 2.6);
            const op = clamp(near, 0, 1) * intro;
            if (op <= 0.001) return null;
            return (
              <div
                key={s.src}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  opacity: op,
                  transform: `translateY(${(1 - op) * 14}px)`,
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: C.accent,
                  }}
                >
                  {String(i + 1).padStart(2, "0")} / {String(SLIDES.length).padStart(2, "0")}
                </div>
                <div
                  style={{
                    fontSize: 38,
                    fontWeight: 700,
                    color: C.ink,
                    letterSpacing: "-0.02em",
                    marginTop: 8,
                    whiteSpace: "nowrap",
                  }}
                >
                  {s.title}
                </div>
                <div style={{ fontSize: 18, color: C.dim, marginTop: 8, whiteSpace: "nowrap" }}>
                  {s.benefit}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 10, paddingTop: 8, opacity: intro }}>
          {SLIDES.map((s, i) => {
            const on = clamp(1 - Math.abs(pos - i), 0, 1);
            return (
              <div
                key={s.src}
                style={{ width: 30 + on * 34, height: 6, background: C.rule, position: "relative" }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: C.accent,
                    transform: `scaleX(${on})`,
                    transformOrigin: "left",
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------- mount: clock + responsive scaling ---------- */

const STAGE_WIDTH = 1600;
const STAGE_HEIGHT = 900;

function useLoopClock(duration: number, active: boolean) {
  const [time, setTime] = useState(0);
  const lastRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setTime(CUES.Tela1 + 1.2);
      return;
    }
    let raf = 0;
    const step = (ts: number) => {
      if (lastRef.current == null) lastRef.current = ts;
      const dt = (ts - lastRef.current) / 1000;
      lastRef.current = ts;
      setTime((t) => (t + dt) % duration);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      lastRef.current = null;
    };
  }, [duration, active]);

  return time;
}

export function BrusyncCarouselAnimation() {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => setScale(Math.max(0.05, el.clientWidth / STAGE_WIDTH));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), {
      threshold: 0.1,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const T = useLoopClock(TOTAL_DURATION, isVisible);

  return (
    <div className={`brusync-carousel-frame ${archivo.variable}`} aria-hidden="true">
      <div className="brusync-carousel-stage" ref={stageRef}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: STAGE_WIDTH,
            height: STAGE_HEIGHT,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            fontFamily: "var(--font-archivo-carousel), sans-serif",
          }}
        >
          <CarouselWindow T={T} />
        </div>
      </div>
    </div>
  );
}
