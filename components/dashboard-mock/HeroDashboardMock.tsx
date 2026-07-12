"use client";

import { useHeroParallax } from "@/hooks/useHeroParallax";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useTilt } from "@/hooks/useTilt";

export function HeroDashboardMock() {
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
        <div className="dash" aria-hidden="true" data-tilt ref={tiltRef}>
          <div className="dash-side">
            <div className="dash-logo">
              Brusync<i>.</i>
            </div>
            <div className="dash-item on">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
              Visão Geral
            </div>
            <div className="dash-item">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 3v18h18" />
                <path d="m7 14 4-4 3 3 5-6" />
              </svg>
              Marketing
            </div>
            <div className="dash-item">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="9" cy="21" r="1.4" />
                <circle cx="19" cy="21" r="1.4" />
                <path d="M2 3h3l3 13h11l2-9H6" />
              </svg>
              Vendas
            </div>
            <div className="dash-item">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              Financeiro
            </div>
            <div className="dash-item">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19 12a7 7 0 1 1-14 0 7 7 0 0 1 14 0z" />
              </svg>
              Operações
            </div>
            <div className="dash-item">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
              </svg>
              Relatórios
            </div>
            <div className="dash-item">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
                <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
              </svg>
              Integrações
            </div>
            <div className="dash-item">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.63.26 1.1.83 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              Configurações
            </div>
          </div>
          <div className="dash-main">
            <div className="dash-top">
              <div className="dash-title">Visão Geral</div>
              <div className="dash-user">
                <span className="dash-chip">01/06/2026 – 30/06/2026</span>
                <span className="dash-avatar" />
              </div>
            </div>
            <div className="kpis">
              <div className="kpi">
                <div className="k-label">Faturamento</div>
                <div className="k-val">
                  <span className="cnt" data-target="1.25" data-fmt="brlM">
                    R$ 1,25M
                  </span>
                </div>
                <div className="k-delta">▲ 18,6%</div>
              </div>
              <div className="kpi">
                <div className="k-label">Lucro Líquido</div>
                <div className="k-val">
                  <span className="cnt" data-target="246" data-fmt="brlK">
                    R$ 246K
                  </span>
                </div>
                <div className="k-delta">▲ 12,4%</div>
              </div>
              <div className="kpi">
                <div className="k-label">ROAS</div>
                <div className="k-val">
                  <span className="cnt" data-target="4.32" data-fmt="dec2">
                    4,32
                  </span>
                </div>
                <div className="k-delta">▲ 8,1%</div>
              </div>
              <div className="kpi">
                <div className="k-label">Leads</div>
                <div className="k-val">
                  <span className="cnt" data-target="1487" data-fmt="thousand">
                    1.487
                  </span>
                </div>
                <div className="k-delta">▲ 15,3%</div>
              </div>
            </div>
            <div className="dash-row">
              <div className="panel">
                <div className="p-label">Faturamento</div>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 300 96"
                  width="100%"
                  height="96"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="lg1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1F5EFF" stopOpacity=".28" />
                      <stop offset="100%" stopColor="#1F5EFF" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0 78 C25 70,40 60,60 62 S95 48,115 50 S150 30,170 36 S205 20,225 24 S265 8,300 12 L300 96 L0 96 Z"
                    fill="url(#lg1)"
                  />
                  <path
                    className="chart-line"
                    pathLength={1}
                    d="M0 78 C25 70,40 60,60 62 S95 48,115 50 S150 30,170 36 S205 20,225 24 S265 8,300 12"
                    fill="none"
                    stroke="#1F5EFF"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                  <circle
                    className="chart-dot"
                    cx="225"
                    cy="24"
                    r="3.4"
                    fill="#fff"
                    stroke="#1F5EFF"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <div className="panel">
                <div className="p-label">Canais de Marketing</div>
                <div className="donut-wrap">
                  <svg aria-hidden="true" viewBox="0 0 42 42" width="82" height="82">
                    <circle cx="21" cy="21" r="15.9" fill="none" stroke="#EAF0F8" strokeWidth="6" />
                    <circle
                      className="chart-donut"
                      style={{ ["--seg" as string]: "42 58" }}
                      cx="21"
                      cy="21"
                      r="15.9"
                      fill="none"
                      stroke="#1F5EFF"
                      strokeWidth="6"
                      strokeDasharray="42 58"
                      strokeDashoffset="25"
                      strokeLinecap="round"
                    />
                    <circle
                      className="chart-donut"
                      style={{ ["--seg" as string]: "28 72" }}
                      cx="21"
                      cy="21"
                      r="15.9"
                      fill="none"
                      stroke="#25D0C3"
                      strokeWidth="6"
                      strokeDasharray="28 72"
                      strokeDashoffset="83"
                      strokeLinecap="round"
                    />
                    <circle
                      className="chart-donut"
                      style={{ ["--seg" as string]: "17 83" }}
                      cx="21"
                      cy="21"
                      r="15.9"
                      fill="none"
                      stroke="#081C3A"
                      strokeWidth="6"
                      strokeDasharray="17 83"
                      strokeDashoffset="55"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="legend">
                    <span>
                      <span className="dot" style={{ background: "#1F5EFF" }} />
                      Google Ads
                    </span>
                    <span>
                      <span className="dot" style={{ background: "#25D0C3" }} />
                      Meta Ads
                    </span>
                    <span>
                      <span className="dot" style={{ background: "#081C3A" }} />
                      LinkedIn Ads
                    </span>
                    <span>
                      <span className="dot" style={{ background: "#CBD6E5" }} />
                      Outros
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="kpis" style={{ marginTop: 9 }}>
              <div className="kpi">
                <div className="k-label">Investimento</div>
                <div className="k-val">
                  <span className="cnt" data-target="289" data-fmt="brlK">
                    R$ 289K
                  </span>
                </div>
                <div className="k-delta">▲ 14,2%</div>
              </div>
              <div className="kpi">
                <div className="k-label">Custo por Lead</div>
                <div className="k-val">
                  <span className="cnt" data-target="19.64" data-fmt="brlDec2">
                    R$ 19,64
                  </span>
                </div>
                <div className="k-delta" style={{ color: "#12A594" }}>
                  ▼ 8,7%
                </div>
              </div>
              <div className="kpi">
                <div className="k-label">Taxa de Conversão</div>
                <div className="k-val">
                  <span className="cnt" data-target="3.42" data-fmt="percent2">
                    3,42%
                  </span>
                </div>
                <div className="k-delta">▲ 6,1%</div>
              </div>
              <div className="kpi">
                <div className="k-label">Clientes Ativos</div>
                <div className="k-val">
                  <span className="cnt" data-target="312" data-fmt="int">
                    312
                  </span>
                </div>
                <div className="k-delta">▲ 11,4%</div>
              </div>
            </div>
          </div>
        </div>
        <div
          className="float-chip"
          style={{ top: -14, right: 22, ["--rot" as string]: "-4deg" }}
          aria-hidden="true"
        >
          <svg
            aria-hidden="true"
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
          >
            <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
          </svg>
        </div>
        <div
          className="float-chip"
          style={{ bottom: -12, left: 18, ["--rot" as string]: "3deg", animationDelay: "1.4s" }}
          aria-hidden="true"
        >
          <svg
            aria-hidden="true"
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 3" />
          </svg>
        </div>
      </div>
    </div>
  );
}
