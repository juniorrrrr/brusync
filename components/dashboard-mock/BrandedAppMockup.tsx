"use client";

import { useHeroParallax } from "@/hooks/useHeroParallax";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useTilt } from "@/hooks/useTilt";

export function BrandedAppMockup() {
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
        <div className="app-mock" aria-hidden="true" data-tilt ref={tiltRef}>
          <div className="browser-chrome">
            <span className="chrome-dot" />
            <span className="chrome-dot" />
            <span className="chrome-dot" />
            <div className="chrome-domain">
              <svg
                aria-hidden="true"
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
              >
                <rect x="4" y="10" width="16" height="10" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
              app.suaempresa.com.br
            </div>
          </div>
          <div className="app-mock-body">
            <div className="app-mock-brand">
              <span className="app-mock-logo-dot" />
              Sua Marca<i>.</i>
            </div>
            <div className="kpis">
              <div className="kpi">
                <div className="k-label">Faturamento</div>
                <div className="k-val">
                  <span className="cnt" data-target="1.86" data-fmt="brlM">
                    R$ 1,86M
                  </span>
                </div>
                <div className="k-delta">▲ 22,4%</div>
              </div>
              <div className="kpi">
                <div className="k-label">Clientes ativos</div>
                <div className="k-val">
                  <span className="cnt" data-target="3240" data-fmt="thousand">
                    3.240
                  </span>
                </div>
                <div className="k-delta">▲ 9,8%</div>
              </div>
              <div className="kpi">
                <div className="k-label">Satisfação</div>
                <div className="k-val">
                  <span className="cnt" data-target="97" data-fmt="pctint">
                    97%
                  </span>
                </div>
                <div className="k-delta">▲ 3,1%</div>
              </div>
              <div className="kpi">
                <div className="k-label">Eficiência</div>
                <div className="k-val">
                  <span className="cnt" data-target="41" data-fmt="pctint">
                    41%
                  </span>
                </div>
                <div className="k-delta">▲ tempo</div>
              </div>
            </div>
            <div className="dash-row">
              <div className="panel">
                <div className="p-label">Crescimento</div>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 300 92"
                  width="100%"
                  height="92"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="bamGrowth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#25D0C3" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#25D0C3" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0 80 C30 74,50 62,70 64 S110 40,130 44 S165 22,185 26 S225 10,250 14 S285 4,300 6 L300 92 L0 92 Z"
                    fill="url(#bamGrowth)"
                  />
                  <path
                    className="chart-line"
                    pathLength={1}
                    d="M0 80 C30 74,50 62,70 64 S110 40,130 44 S165 22,185 26 S225 10,250 14 S285 4,300 6"
                    fill="none"
                    stroke="#25D0C3"
                    strokeWidth="2.2"
                  />
                </svg>
              </div>
              <div className="panel">
                <div className="p-label">Módulos ativos</div>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 42 42"
                  width="78"
                  height="78"
                  style={{ margin: "0 auto" }}
                >
                  <circle cx="21" cy="21" r="15.9" fill="none" stroke="#EAF0F8" strokeWidth="6" />
                  <circle
                    className="chart-donut"
                    style={{ ["--seg" as string]: "62 38" }}
                    cx="21"
                    cy="21"
                    r="15.9"
                    fill="none"
                    stroke="#1F5EFF"
                    strokeWidth="6"
                    strokeDasharray="62 38"
                    strokeDashoffset="25"
                    strokeLinecap="round"
                  />
                  <circle
                    className="chart-donut"
                    style={{ ["--seg" as string]: "22 78" }}
                    cx="21"
                    cy="21"
                    r="15.9"
                    fill="none"
                    stroke="#25D0C3"
                    strokeWidth="6"
                    strokeDasharray="22 78"
                    strokeDashoffset="63"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
