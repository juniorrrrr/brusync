"use client";

import { useTilt } from "@/hooks/useTilt";

export function SolutionDashboardMock() {
  const tiltRef = useTilt<HTMLDivElement>();

  return (
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
              <circle cx="12" cy="12" r="8" />
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
        </div>
        <div className="dash-main">
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
              <div className="k-label">Lucro</div>
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
                viewBox="0 0 300 92"
                width="100%"
                height="92"
                preserveAspectRatio="none"
              >
                <path
                  d="M0 76 C30 66,50 58,70 60 S110 42,130 46 S165 28,185 32 S225 14,250 18 S285 6,300 8 L300 92 L0 92 Z"
                  fill="url(#lg1)"
                />
                <path
                  className="chart-line"
                  pathLength={1}
                  d="M0 76 C30 66,50 58,70 60 S110 42,130 46 S165 28,185 32 S225 14,250 18 S285 6,300 8"
                  fill="none"
                  stroke="#1F5EFF"
                  strokeWidth="2.2"
                />
              </svg>
            </div>
            <div className="panel">
              <div className="p-label">Canais</div>
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
                  style={{ ["--seg" as string]: "45 55" }}
                  cx="21"
                  cy="21"
                  r="15.9"
                  fill="none"
                  stroke="#1F5EFF"
                  strokeWidth="6"
                  strokeDasharray="45 55"
                  strokeDashoffset="25"
                  strokeLinecap="round"
                />
                <circle
                  className="chart-donut"
                  style={{ ["--seg" as string]: "30 70" }}
                  cx="21"
                  cy="21"
                  r="15.9"
                  fill="none"
                  stroke="#25D0C3"
                  strokeWidth="6"
                  strokeDasharray="30 70"
                  strokeDashoffset="80"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
          <div className="dash-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="panel">
              <div className="p-label">Top Campanhas</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div className="pbar">
                  <span style={{ ["--w" as string]: "78%", background: "#1F5EFF" }} />
                </div>
                <div className="pbar">
                  <span style={{ ["--w" as string]: "62%", background: "#25D0C3" }} />
                </div>
                <div className="pbar">
                  <span style={{ ["--w" as string]: "41%", background: "#081C3A" }} />
                </div>
              </div>
            </div>
            <div className="panel">
              <div className="p-label">Leads por canal</div>
              <svg
                aria-hidden="true"
                viewBox="0 0 120 44"
                width="100%"
                height="44"
                preserveAspectRatio="none"
              >
                <rect
                  className="chart-bar"
                  x="6"
                  y="18"
                  width="12"
                  height="26"
                  rx="2.5"
                  fill="#1F5EFF"
                />
                <rect
                  className="chart-bar"
                  x="26"
                  y="8"
                  width="12"
                  height="36"
                  rx="2.5"
                  fill="#25D0C3"
                />
                <rect
                  className="chart-bar"
                  x="46"
                  y="24"
                  width="12"
                  height="20"
                  rx="2.5"
                  fill="#1F5EFF"
                  opacity=".55"
                />
                <rect
                  className="chart-bar"
                  x="66"
                  y="14"
                  width="12"
                  height="30"
                  rx="2.5"
                  fill="#25D0C3"
                  opacity=".6"
                />
                <rect
                  className="chart-bar"
                  x="86"
                  y="28"
                  width="12"
                  height="16"
                  rx="2.5"
                  fill="#081C3A"
                  opacity=".5"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
