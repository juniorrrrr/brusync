"use client";

import { useRef } from "react";
import { OwnershipCompare } from "@/components/sections/OwnershipCompare";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { useDataFlow } from "@/hooks/useDataFlow";
import type { SourcePlatform } from "@/types";

const AFTER_CHIPS = [
  "Plataforma única",
  "CRM integrado",
  "Automação",
  "Agentes de IA",
  "Indicadores em tempo real",
];

const PLATFORMS: SourcePlatform[] = [
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
    name: "TikTok Ads",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path fill="#FE2C55" d="M9.5 8.5v7.2a2.4 2.4 0 1 1-2-2.36V10.9a5 5 0 1 0 4.6 4.98V9.9z" />
        <path fill="#25F4EE" d="M8.7 7.7v7.2a2.4 2.4 0 1 1-2-2.36V10.1a5 5 0 1 0 4.6 4.98V9.1z" />
        <path
          fill="#081C3A"
          d="M8.1 7.2v7.2a2.4 2.4 0 1 1-2-2.36V9.6a5 5 0 1 0 4.6 4.98V8.6a5.6 5.6 0 0 0 3.4 1.16V7.36a3.3 3.3 0 0 1-2.1-.76 3.4 3.4 0 0 1-1.2-2.5H8.6z"
        />
      </svg>
    ),
  },
  {
    name: "LinkedIn Ads",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <rect width="24" height="24" rx="5" fill="#0A66C2" />
        <text x="12" y="16.5" textAnchor="middle" fontSize="12" fontWeight="800" fill="#fff">
          in
        </text>
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
    name: "Mercado Livre",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="12" fill="#FFE600" />
        <text x="12" y="16" textAnchor="middle" fontSize="9.5" fontWeight="800" fill="#2D3277">
          ML
        </text>
      </svg>
    ),
  },
  {
    name: "Shopee",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <rect width="24" height="24" rx="6" fill="#EE4D2D" />
        <path
          fill="none"
          stroke="#fff"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6.5 9.5h11l-.9 9.2a1.4 1.4 0 0 1-1.4 1.3H8.8a1.4 1.4 0 0 1-1.4-1.3z"
        />
        <path fill="none" stroke="#fff" strokeWidth="1.6" d="M9 9.2a3 3 0 0 1 6 0" />
      </svg>
    ),
  },
  {
    name: "Amazon",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <text x="12" y="15" textAnchor="middle" fontSize="13" fontWeight="800" fill="#131921">
          a
        </text>
        <path
          fill="none"
          stroke="#FF9900"
          strokeWidth="1.8"
          strokeLinecap="round"
          d="M5.5 18c4 2.2 9 2.2 13 0"
        />
      </svg>
    ),
  },
  {
    name: "HubSpot",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="4" fill="none" stroke="#FF7A59" strokeWidth="1.8" />
        <circle cx="12" cy="4" r="2" fill="#FF7A59" />
        <circle cx="19" cy="15" r="2" fill="#FF7A59" />
        <circle cx="5" cy="15" r="2" fill="#FF7A59" />
      </svg>
    ),
  },
  {
    name: "Salesforce",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="#00A1E0">
        <path d="M10 6.5a3.7 3.7 0 0 1 5.8 1.6 3 3 0 0 1 4.2 2.8 3.1 3.1 0 0 1-3.1 3.1H6.6A3.6 3.6 0 0 1 3 10.4a3.6 3.6 0 0 1 5.8-2.9A3.7 3.7 0 0 1 10 6.5z" />
      </svg>
    ),
  },
  {
    name: "RD Station",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <rect width="24" height="24" rx="6" fill="#FF6B00" />
        <text x="12" y="16" textAnchor="middle" fontSize="9.5" fontWeight="800" fill="#fff">
          RD
        </text>
      </svg>
    ),
  },
  {
    name: "SAP",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <rect width="24" height="24" rx="4" fill="#001E62" />
        <text x="12" y="15.5" textAnchor="middle" fontSize="8.5" fontWeight="800" fill="#fff">
          SAP
        </text>
      </svg>
    ),
  },
  {
    name: "Bling",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="12" fill="#6FBE44" />
        <text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff">
          B
        </text>
      </svg>
    ),
  },
  {
    name: "Omie",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="12" fill="#2D5BFF" />
        <text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff">
          O
        </text>
      </svg>
    ),
  },
  {
    name: "PostgreSQL",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <ellipse cx="12" cy="5.5" rx="8" ry="3" fill="#336791" />
        <path fill="#336791" opacity=".7" d="M4 5.5V12c0 1.7 3.6 3 8 3s8-1.3 8-3V5.5" />
        <path fill="#336791" opacity=".45" d="M4 12v6.5c0 1.7 3.6 3 8 3s8-1.3 8-3V12" />
      </svg>
    ),
  },
  {
    name: "MySQL",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <ellipse cx="12" cy="5.5" rx="8" ry="3" fill="#00758F" />
        <path fill="#00758F" opacity=".7" d="M4 5.5V12c0 1.7 3.6 3 8 3s8-1.3 8-3V5.5" />
        <path fill="#00758F" opacity=".45" d="M4 12v6.5c0 1.7 3.6 3 8 3s8-1.3 8-3V12" />
      </svg>
    ),
  },
  {
    name: "BigQuery",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" fill="none" stroke="#E7EDF5" strokeWidth="3" />
        <path d="M12 3a9 9 0 0 1 9 9h-9z" fill="#4285F4" />
        <path d="M21 12a9 9 0 0 1-4 7.5l-5-7.5z" fill="#EA4335" />
        <path d="M17 19.5A9 9 0 0 1 3 12h9z" fill="#FBBC04" />
      </svg>
    ),
  },
  {
    name: "Supabase",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path fill="#3ECF8E" d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
      </svg>
    ),
  },
  {
    name: "Google Sheets",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="16" rx="2" fill="#0F9D58" />
        <path
          fill="#fff"
          d="M3 9h18v1.4H3zm0 4.5h18v1.4H3zM9 5h1.4v14H9zm5 0h1.4v14H14z"
          opacity=".85"
        />
      </svg>
    ),
  },
  {
    name: "Excel",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <rect x="2" y="4" width="13" height="16" rx="1.5" fill="#107C41" />
        <path fill="#fff" d="m5.5 8 2.2 4-2.3 4h2l1.3-2.5L10 16h2l-2.3-4L12 8h-2L8.7 10.4 7.5 8z" />
        <rect x="15" y="7" width="7" height="10" rx="1" fill="#185C37" />
        <path fill="#fff" d="M16.5 9h4v1.4h-4zm0 2.5h4v1.4h-4zm0 2.5h4v1.4h-4z" />
      </svg>
    ),
  },
  {
    name: "Notion",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <rect width="24" height="24" rx="5" fill="#081C3A" />
        <text x="12" y="16" textAnchor="middle" fontSize="12" fontWeight="800" fill="#fff">
          N
        </text>
      </svg>
    ),
  },
  {
    name: "+ outras integrações",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v8M8 12h8" />
      </svg>
    ),
  },
];

export function TransformationSection() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const linesRef = useRef<SVGGElement | null>(null);
  const particlesRef = useRef<SVGGElement | null>(null);

  useDataFlow({ wrapRef, linesRef, particlesRef });

  return (
    <section className="problem" id="transformacao">
      <div className="ambient" aria-hidden="true">
        <div className="grid-lines" style={{ opacity: 0.55 }} />
      </div>
      <Container>
        <Reveal as="h2" className="sec-title">
          De ferramentas soltas para <span className="accent">o seu próprio sistema.</span>
        </Reveal>
        <Reveal as="p" className="sec-sub">
          Hoje sua operação provavelmente está espalhada entre planilhas, sistemas prontos e
          ferramentas que não conversam entre si — e cada uma cobra a sua própria mensalidade.
        </Reveal>

        <Reveal className="logo-marquee" delay={1}>
          <div className="logo-track">
            {(["a", "b"] as const).flatMap((set) =>
              PLATFORMS.map((p) => (
                <div
                  className={`logo-chip${p.name.startsWith("+") ? " more" : ""}`}
                  key={`${set}-${p.name}`}
                >
                  {p.icon}
                  <span>{p.name}</span>
                </div>
              )),
            )}
          </div>
        </Reveal>

        <Reveal className="flow-mid" delay={2}>
          Cada uma dessas ferramentas faz uma parte do trabalho. Nenhuma delas é o seu sistema.
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
              </defs>
              <g className="df-lines" ref={linesRef} />
              <g className="df-particles" ref={particlesRef} />
            </svg>

            <div className="df-core" style={{ left: "50%", top: "48%" }}>
              <div className="df-core-ring" />
              <div className="df-core-glow" />
              <div className="df-core-card">
                <div className="df-core-logo">
                  Brusync<i>.</i>
                </div>
                <div className="df-core-label">Sua plataforma</div>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal className="flow-arrow" delay={4} aria-hidden="true">
          ↓
        </Reveal>
        <Reveal className="flow-outputs" delay={4}>
          {AFTER_CHIPS.map((chip) => (
            <span className="flow-chip" key={chip}>
              {chip}
            </span>
          ))}
        </Reveal>

        <Reveal delay={5}>
          <OwnershipCompare />
        </Reveal>
      </Container>
    </section>
  );
}
