"use client";

import { useTilt } from "@/hooks/useTilt";

const LOCK_PATH = (
  <>
    <rect x="5" y="10.5" width="14" height="9.5" rx="2.2" />
    <path d="M8 10.5V7.2a4 4 0 0 1 8 0v3.3" />
  </>
);

function MiniBrowser({ domain, muted }: { domain: string; muted?: boolean }) {
  return (
    <div className={`own2-browser${muted ? " is-muted" : ""}`} aria-hidden="true">
      <div className="own2-browser-bar">
        <span className="own2-dot" />
        <span className="own2-dot" />
        <span className="own2-dot" />
        <div className="own2-url">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
          >
            {LOCK_PATH}
          </svg>
          {domain}
        </div>
      </div>
      <div className="own2-screen">
        <div className="own2-screen-nav">
          <span className="own2-brand-dot" />
          <span className="own2-avatar" />
        </div>
        <div className="own2-bars">
          <span style={{ ["--h" as string]: "38%" }} />
          <span style={{ ["--h" as string]: "64%" }} />
          <span style={{ ["--h" as string]: "48%" }} />
          <span style={{ ["--h" as string]: "82%" }} />
          <span style={{ ["--h" as string]: "58%" }} />
        </div>
      </div>
    </div>
  );
}

function CodeChips({ locked }: { locked?: boolean }) {
  const items = locked
    ? [
        { label: "Sem Git", icon: <>{LOCK_PATH}</> },
        { label: "Sem deploy", icon: <>{LOCK_PATH}</> },
        { label: "Sem source", icon: <>{LOCK_PATH}</> },
      ]
    : [
        {
          label: "Git",
          icon: (
            <>
              <circle cx="6.2" cy="4.4" r="2.2" />
              <circle cx="6.2" cy="16.6" r="2.2" />
              <circle cx="16.6" cy="10.6" r="2.2" />
              <path d="M6.2 6.6v7.8M6.2 8a6 6 0 0 0 6 5.9h2.2" />
            </>
          ),
        },
        {
          label: "Deploy",
          icon: (
            <>
              <circle cx="12" cy="12" r="8.6" />
              <path d="M12 16V8m-3.6 3.6L12 8l3.6 3.6" />
            </>
          ),
        },
        {
          label: "Source",
          icon: <path d="m9 7.5-4.5 4.5L9 16.5M15 7.5 19.5 12 15 16.5" />,
        },
      ];

  return (
    <div className={`own2-chips${locked ? " is-locked" : ""}`} aria-hidden="true">
      {items.map((item, i) => (
        <span className="own2-chip-wrap" key={item.label}>
          <span className="own2-chip">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              {item.icon}
            </svg>
            {item.label}
          </span>
          {i < items.length - 1 && <span className="own2-chip-line" />}
        </span>
      ))}
    </div>
  );
}

interface OwnCardProps {
  tone: "bad" | "good";
  eyebrow: string;
  title: string;
  rows: string[];
}

function OwnCard({ tone, eyebrow, title, rows }: OwnCardProps) {
  const tiltRef = useTilt<HTMLDivElement>();
  const good = tone === "good";

  return (
    <div className={`own2-card own2-card-${tone}`} data-tilt="" data-spot="" ref={tiltRef}>
      <div className="own2-card-inner">
        <MiniBrowser
          domain={good ? "app.suaempresa.com.br" : "suaempresa.plataformax.com"}
          muted={!good}
        />
        <CodeChips locked={!good} />

        <div className="own2-eyebrow">{eyebrow}</div>
        <h4 className="own2-title">{title}</h4>

        <div className="own2-rows">
          {rows.map((row) => (
            <div className="own2-row" key={row}>
              <span className="own2-mark" aria-hidden="true">
                {good ? (
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.6"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                ) : (
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.6"
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                )}
              </span>
              {row}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const RENTED_ROWS = [
  "Mensalidade que só cresce",
  "Sua marca escondida atrás da marca deles",
  "Funcionalidades genéricas, iguais para todo mundo",
  "Parou de pagar? Perdeu tudo.",
];

const OWNED_ROWS = [
  "Você é dono do sistema",
  "Sua marca, do login ao dashboard",
  "Construído para a forma como você trabalha",
  "Cresce com a sua empresa, para sempre",
];

export function OwnershipCompare() {
  return (
    <div className="own2">
      <div className="own2-bg" aria-hidden="true">
        <div className="own2-grid" />
        <div className="own2-glow own2-glow-a" />
        <div className="own2-glow own2-glow-b" />
        <div className="own2-noise" />
      </div>

      <div className="own2-heading">
        <h3>Isso não é um software alugado.</h3>
        <p>
          É o seu <span className="accent">ativo digital.</span>
        </p>
      </div>

      <div className="own2-stage">
        <OwnCard
          tone="bad"
          eyebrow="Plataforma pronta (SaaS)"
          title="Software de terceiro"
          rows={RENTED_ROWS}
        />

        <div className="own2-vs" aria-hidden="true">
          <span className="own2-vs-line" />
          <span className="own2-vs-badge">VS</span>
          <span className="own2-vs-line" />
        </div>

        <OwnCard
          tone="good"
          eyebrow="Feito com a Brusync"
          title="Software Brusync"
          rows={OWNED_ROWS}
        />
      </div>
    </div>
  );
}
