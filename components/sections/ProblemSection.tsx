"use client";

import { useRef } from "react";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { useDataFlow } from "@/hooks/useDataFlow";
import type { ConsequenceItem, SourcePlatform } from "@/types";

const SOURCES: SourcePlatform[] = [
  {
    name: "Google Ads",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M14.1 4.9 6.6 17.8a3.4 3.4 0 0 1-5.9-3.4L8.2 1.5a3.4 3.4 0 0 1 5.9 3.4z"
          transform="translate(1.5 2.4) scale(.92)"
        />
        <circle cx="4.8" cy="18.3" r="3" fill="#34A853" />
        <path fill="#FBBC04" d="m15.7 7.3 4.7 8.1a3.4 3.4 0 1 1-5.9 3.4l-4.7-8.1z" />
      </svg>
    ),
  },
  {
    name: "Meta Ads",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path
          fill="#0081FB"
          d="M6.9 5C4.2 5 2 9 2 13.1 2 15.5 3.1 17 5 17c1.8 0 2.9-1.3 4.9-4.7l1-1.7.3.5 1.3 2.2C14.4 16.6 15.6 17 17 17c2 0 3-1.6 3-4C20 8.9 17.8 5 15.1 5c-1.6 0-2.9 1-4.6 3.5L10 9.3 9.5 8.5C7.9 6 6.7 5 6.9 5z"
        />
      </svg>
    ),
  },
  {
    name: "Google Analytics 4",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <rect x="14" y="3" width="6" height="18" rx="2.6" fill="#F9AB00" />
        <rect x="8" y="9" width="5" height="12" rx="2.4" fill="#E37400" />
        <rect x="2" y="15" width="5" height="6" rx="2.4" fill="#E37400" />
      </svg>
    ),
  },
  {
    name: "CRM",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="#7B61FF" strokeWidth="2">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
      </svg>
    ),
  },
  {
    name: "Planilhas",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="16" rx="2" fill="#107C41" />
        <path
          fill="#fff"
          d="M3 9h18v1.4H3zm0 4.5h18v1.4H3zM9 5h1.4v14H9zm5 0h1.4v14H14z"
          opacity=".85"
        />
      </svg>
    ),
  },
  {
    name: "ERP",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="#3E63DD" strokeWidth="2">
        <ellipse cx="12" cy="5.5" rx="8" ry="3" />
        <path d="M4 5.5V12c0 1.7 3.6 3 8 3s8-1.3 8-3V5.5" />
        <path d="M4 12v6.5c0 1.7 3.6 3 8 3s8-1.3 8-3V12" />
      </svg>
    ),
  },
];

const CONSEQUENCES: ConsequenceItem[] = [
  {
    title: "Perda de tempo",
    description: "Processos manuais e retrabalho constante.",
    icon: (
      <svg
        aria-hidden="true"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="13" r="8" />
        <path d="M12 9v4l2.5 2.5M9 2h6" />
      </svg>
    ),
  },
  {
    title: "Erros",
    description: "Dados desencontrados e inconsistentes.",
    icon: (
      <svg
        aria-hidden="true"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="m13 2-2 8h5l-7 12 2-9H6z" />
      </svg>
    ),
  },
  {
    title: "Decisões lentas",
    description: "Falta de agilidade para responder ao mercado.",
    icon: (
      <svg
        aria-hidden="true"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l-3 3" />
      </svg>
    ),
  },
  {
    title: "Falta de visão estratégica",
    description: "Dificuldade para enxergar o todo do negócio.",
    icon: (
      <svg
        aria-hidden="true"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M2 2l20 20M10.6 5.1A9.8 9.8 0 0 1 12 5c7 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6A16.9 16.9 0 0 0 2 12s3 7 10 7c1.6 0 3-.3 4.3-.9" />
      </svg>
    ),
  },
];

export function ProblemSection() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const linesRef = useRef<SVGGElement | null>(null);
  const particlesRef = useRef<SVGGElement | null>(null);
  const kpiRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const barRefs = useRef<(SVGRectElement | null)[]>([]);

  useDataFlow({ wrapRef, linesRef, particlesRef, kpiRefs, barRefs });

  return (
    <section className="problem">
      <div className="ambient" aria-hidden="true">
        <div className="grid-lines" style={{ opacity: 0.55 }} />
      </div>
      <Container>
        <Reveal as="h2" className="sec-title">
          Sua empresa toma decisões
          <br />
          com <span className="accent">dados espalhados?</span>
        </Reveal>

        <Reveal className="src-grid" delay={1}>
          {SOURCES.map((s) => (
            <div key={s.name} className="src-card" data-spot="">
              {s.icon}
              {s.name}
            </div>
          ))}
        </Reveal>

        <Reveal className="flow-mid" delay={2}>
          Cada informação em um lugar diferente.
        </Reveal>

        <Reveal className="data-flow" delay={3} aria-hidden="true">
          <div ref={wrapRef} style={{ position: "absolute", inset: 0 }}>
            <svg
              aria-hidden="true"
              className="df-svg"
              viewBox="0 0 1160 300"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <linearGradient id="dfGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#1F5EFF" />
                  <stop offset="100%" stopColor="#25D0C3" />
                </linearGradient>
                <filter id="dfBlur" x="-200%" y="-200%" width="500%" height="500%">
                  <feGaussianBlur stdDeviation="3" />
                </filter>
              </defs>
              <g className="df-lines" ref={linesRef} />
              <g className="df-particles" ref={particlesRef} />
            </svg>

            <div className="df-core" style={{ left: "51.7%", top: "43.3%" }}>
              <div className="df-core-ring" />
              <div className="df-core-glow" />
              <div className="df-core-card">
                <div className="df-core-logo">
                  Brusync<i>.</i>
                </div>
                <div className="df-core-label">Processando</div>
              </div>
            </div>

            <div className="df-dash" style={{ left: "91.4%", top: "80%" }}>
              <div className="df-dash-head">Dashboard Inteligente</div>
              <div className="df-dash-kpis">
                <div className="df-kpi">
                  <span
                    ref={(el) => {
                      kpiRefs.current[0] = el;
                    }}
                  >
                    R$ 1,25M
                  </span>
                </div>
                <div className="df-kpi">
                  <span
                    ref={(el) => {
                      kpiRefs.current[1] = el;
                    }}
                  >
                    312
                  </span>
                </div>
              </div>
              <svg
                aria-hidden="true"
                className="df-dash-chart"
                viewBox="0 0 120 34"
                width="100%"
                height="34"
                preserveAspectRatio="none"
              >
                <rect
                  ref={(el) => {
                    barRefs.current[0] = el;
                  }}
                  x="6"
                  y="16"
                  width="9"
                  height="18"
                  rx="2"
                  fill="#1F5EFF"
                />
                <rect
                  ref={(el) => {
                    barRefs.current[1] = el;
                  }}
                  x="20"
                  y="10"
                  width="9"
                  height="24"
                  rx="2"
                  fill="#25D0C3"
                />
                <rect
                  ref={(el) => {
                    barRefs.current[2] = el;
                  }}
                  x="34"
                  y="18"
                  width="9"
                  height="16"
                  rx="2"
                  fill="#1F5EFF"
                  opacity=".6"
                />
                <path
                  d="M50 26 C60 20,66 14,76 16 S94 8,110 6"
                  fill="none"
                  stroke="#1F5EFF"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </Reveal>

        <Reveal className="cons-grid" delay={3}>
          {CONSEQUENCES.map((c) => (
            <div key={c.title} className="cons-card" data-spot="">
              <div className="cons-ico">{c.icon}</div>
              <div>
                <h4>{c.title}</h4>
                <p>{c.description}</p>
              </div>
            </div>
          ))}
        </Reveal>
      </Container>
    </section>
  );
}
