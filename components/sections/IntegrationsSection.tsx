"use client";

import { useRef } from "react";
import { useAntigravityField } from "@/hooks/useAntigravityField";

const BADGES = [
  {
    left: "50%",
    top: "12%",
    label: "Google Ads",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M14.1 4.9 6.6 17.8a3.4 3.4 0 0 1-5.9-3.4L8.2 1.5a3.4 3.4 0 0 1 5.9 3.4z"
          transform="translate(1.5 2.4)"
        />
        <circle cx="4.6" cy="18.5" r="3.1" fill="#34A853" />
        <path fill="#FBBC04" d="m15.7 7.3 4.7 8.1a3.4 3.4 0 1 1-5.9 3.4l-4.7-8.1z" />
      </svg>
    ),
  },
  {
    left: "75.9%",
    top: "19.3%",
    label: "Meta Ads",
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
    left: "91.8%",
    top: "38.3%",
    label: "Google Analytics",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <rect x="14" y="3" width="6" height="18" rx="2.6" fill="#F9AB00" />
        <rect x="8" y="9" width="5" height="12" rx="2.4" fill="#E37400" />
        <rect x="2" y="15" width="5" height="6" rx="2.4" fill="#E37400" />
      </svg>
    ),
  },
  {
    left: "91.8%",
    top: "61.7%",
    label: "Power BI",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <rect x="3" y="12" width="4" height="8" rx="1" fill="#F2C811" />
        <rect x="10" y="7" width="4" height="13" rx="1" fill="#F2C811" />
        <rect x="17" y="3" width="4" height="17" rx="1" fill="#F2C811" />
      </svg>
    ),
  },
  {
    left: "75.9%",
    top: "80.7%",
    label: "Excel",
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
    left: "50%",
    top: "88%",
    label: "API própria",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="#25D0C3" strokeWidth="2">
        <path d="m8 6-5 6 5 6M16 6l5 6-5 6" />
      </svg>
    ),
  },
  {
    left: "24.1%",
    top: "80.7%",
    label: "Supabase",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path fill="#3ECF8E" d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
      </svg>
    ),
  },
  {
    left: "8.2%",
    top: "61.7%",
    label: "PostgreSQL",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <ellipse cx="12" cy="5.5" rx="8" ry="3" fill="#336791" />
        <path fill="#336791" opacity=".7" d="M4 5.5V12c0 1.7 3.6 3 8 3s8-1.3 8-3V5.5" />
        <path fill="#336791" opacity=".45" d="M4 12v6.5c0 1.7 3.6 3 8 3s8-1.3 8-3V12" />
      </svg>
    ),
  },
  {
    left: "8.2%",
    top: "38.3%",
    label: "CRM",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="#7B61FF" strokeWidth="2">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
      </svg>
    ),
  },
  {
    left: "24.1%",
    top: "19.3%",
    label: "ERP",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="#3E63DD" strokeWidth="2">
        <ellipse cx="12" cy="5.5" rx="8" ry="3" />
        <path d="M4 5.5V12c0 1.7 3.6 3 8 3s8-1.3 8-3V5.5" />
        <path d="M4 12v6.5c0 1.7 3.6 3 8 3s8-1.3 8-3V12" />
      </svg>
    ),
  },
];

export function IntegrationsSection() {
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useAntigravityField(fieldRef);

  return (
    <section className="antigravity" id="integracoes" aria-label="Convergência de dados">
      <div className="ag-field" ref={fieldRef}>
        {/* biome-ignore lint/a11y/noAriaHiddenOnFocusable: decorative, non-interactive canvas */}
        <canvas className="ag-canvas" ref={canvasRef} aria-hidden="true" />
        {BADGES.map((b) => (
          <div key={b.label} className="ag-badge" style={{ left: b.left, top: b.top }} data-spot="">
            {b.icon}
            <span>{b.label}</span>
          </div>
        ))}

        <div className="ag-core">
          <div className="ag-core-glow" aria-hidden="true" />
          <div className="ag-core-card">
            <div className="ag-core-logo">
              Brusync<i>.</i>
            </div>
            <div className="ag-core-text">Centralizando seus dados</div>
          </div>
        </div>
      </div>
    </section>
  );
}
