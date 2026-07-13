"use client";

import { useHeroParallax } from "@/hooks/useHeroParallax";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useTilt } from "@/hooks/useTilt";

const SOURCES = [
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
    name: "CRM",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="#7B61FF" strokeWidth="2">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
      </svg>
    ),
  },
  {
    name: "ERP",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="#3E63DD" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 9v12" />
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
    name: "Banco de Dados",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="#081C3A" strokeWidth="2">
        <ellipse cx="12" cy="5" rx="8" ry="2.6" />
        <path d="M4 5v4.7c0 1.4 3.6 2.6 8 2.6s8-1.2 8-2.6V5" />
        <path d="M4 9.7v4.6c0 1.5 3.6 2.7 8 2.7s8-1.2 8-2.7V9.7" />
        <path d="M4 14.3V19c0 1.5 3.6 2.7 8 2.7s8-1.2 8-2.7v-4.7" />
      </svg>
    ),
  },
];

export function DataFlowMockup() {
  const revealRef = useScrollReveal<HTMLDivElement>();
  const parallaxRef = useHeroParallax<HTMLDivElement>();
  const tiltRef = useTilt<HTMLDivElement>();

  return (
    <div
      ref={(el) => {
        revealRef.current = el;
        parallaxRef.current = el;
      }}
      className="reveal"
      data-delay="2"
      id="heroDashWrap"
    >
      <div className="dash-glow tilt-wrap">
        <div className="flow-card" aria-hidden="true" data-tilt ref={tiltRef}>
          <div className="flow-sources">
            {SOURCES.map((s) => (
              <div className="flow-source-chip" key={s.name}>
                {s.icon}
                <span>{s.name}</span>
              </div>
            ))}
          </div>

          <div className="flow-arrow">↓</div>

          <div className="flow-core">
            <div className="flow-core-glow" />
            <svg
              aria-hidden="true"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.7 1 1.5 1 2.5h6c0-1 .2-1.8 1-2.5A6 6 0 0 0 12 3z" />
            </svg>
            Inteligência Artificial
          </div>

          <div className="flow-arrow">↓</div>

          <div className="flow-dashboard-mini">
            <div className="p-label">Dashboard Executivo</div>
            <div className="kpis">
              <div className="kpi">
                <div className="k-label">Faturamento</div>
                <div className="k-val">R$ 1,25M</div>
              </div>
              <div className="kpi">
                <div className="k-label">ROAS</div>
                <div className="k-val">4,32</div>
              </div>
              <div className="kpi">
                <div className="k-label">Leads</div>
                <div className="k-val">1.487</div>
              </div>
            </div>
          </div>

          <div className="flow-arrow">↓</div>

          <div className="flow-outputs">
            <span className="flow-chip">Insights automáticos</span>
            <span className="flow-chip">Tomada de decisão</span>
          </div>
        </div>
      </div>
    </div>
  );
}
