"use client";

import { memo } from "react";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SHOWCASE_AREAS } from "@/constants";
import { useDraggableCarousel } from "@/hooks/useDraggableCarousel";
import { useTilt } from "@/hooks/useTilt";

const CAT_COLORS = [
  "#25D0C3",
  "#1F5EFF",
  "#081C3A",
  "#7B61FF",
  "#E9A23B",
  "#1F5EFF",
  "#081C3A",
  "#25D0C3",
];
const PALETTES: [string, string][] = [
  ["#1F5EFF", "#25D0C3"],
  ["#25D0C3", "#1F5EFF"],
  ["#1F5EFF", "#081C3A"],
  ["#081C3A", "#25D0C3"],
  ["#25D0C3", "#081C3A"],
  ["#1F5EFF", "#25D0C3"],
  ["#081C3A", "#1F5EFF"],
  ["#25D0C3", "#1F5EFF"],
];
const NAMES: [string, string][] = [
  ["Ana P.", "#1F5EFF"],
  ["Bruno S.", "#25D0C3"],
  ["Carla M.", "#081C3A"],
];
const UPDATED = ["agora", "há 1 min", "há 2 min", "há 3 min"];

function sparkPoints(seed: number) {
  let pts = "";
  for (let j = 0; j < 6; j++) {
    const v = (Math.sin(seed * 1.7 + j * 1.3) + 1) / 2;
    pts += `${j * 12},${(15 - v * 11).toFixed(1)} `;
  }
  return pts.trim();
}

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("");
}

function buildCardData(i: number) {
  const [c1, c2] = PALETTES[i];
  const revenue = ((380 + i * 47) % 900) + 120;
  const meta = 82 + ((i * 3) % 14);
  const variation = 8 + ((i * 2) % 19);
  const seg1 = 40 + i * 4;
  const seg2 = 60 - i * 4;
  const seg3 = 85 - i * 4;
  const stackBars = [0, 1, 2, 3].map((j) => {
    const a = 14 + ((i * 7 + j * 5) % 14);
    const b = 8 + ((i * 5 + j * 3) % 10);
    return { j, a, b, x: 6 + j * 16 };
  });
  const rows = [0, 1].map((r) => {
    const [name, color] = NAMES[(i + r) % 3];
    const value = 120 + ((i * 31 + r * 57) % 480);
    const ok = (i + r) % 2 === 0;
    return { name, color, value, ok };
  });
  const updated = UPDATED[i % 4];
  return { c1, c2, revenue, meta, variation, seg1, seg2, seg3, stackBars, rows, updated };
}

const ShowcaseCard = memo(function ShowcaseCard({
  index,
  setCardRef,
}: {
  index: number;
  setCardRef: (el: HTMLDivElement | null) => void;
}) {
  const tiltRef = useTilt<HTMLDivElement>();
  const area = SHOWCASE_AREAS[index];
  const data = buildCardData(index);

  return (
    <div
      className="show-card reveal"
      data-spot=""
      data-tilt=""
      ref={(el) => {
        setCardRef(el);
        tiltRef.current = el;
      }}
    >
      <div className="show-badge-cat" style={{ background: CAT_COLORS[index] }}>
        {area}
      </div>
      {index === 2 && <div className="show-badge-top">Mais utilizado</div>}
      <div className="show-toolbar">
        <div className="show-breadcrumb">
          <span className="dot-online" />
          Visão Geral
        </div>
        <div className="show-filter">
          30 dias
          <svg
            aria-hidden="true"
            width="8"
            height="8"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>
      <div className="show-kpis">
        <div className="show-kpi">
          <div className="k-label">Receita</div>
          <div className="k-val">
            <span className="cnt" data-target={data.revenue} data-fmt="brlKint">
              R$ {data.revenue}K
            </span>
          </div>
          <svg
            aria-hidden="true"
            className="spark"
            viewBox="0 0 60 18"
            width="100%"
            height="18"
            preserveAspectRatio="none"
          >
            <polyline
              className="chart-line"
              pathLength={1}
              points={sparkPoints(index + 1)}
              fill="none"
              stroke={data.c1}
              strokeWidth="1.6"
            />
          </svg>
        </div>
        <div className="show-kpi">
          <div className="k-label">Meta</div>
          <div className="k-val">
            <span className="cnt" data-target={data.meta} data-fmt="pctint">
              {data.meta}%
            </span>
          </div>
          <svg
            aria-hidden="true"
            className="spark"
            viewBox="0 0 60 18"
            width="100%"
            height="18"
            preserveAspectRatio="none"
          >
            <polyline
              className="chart-line"
              pathLength={1}
              points={sparkPoints(index + 2)}
              fill="none"
              stroke={data.c2}
              strokeWidth="1.6"
            />
          </svg>
        </div>
        <div className="show-kpi">
          <div className="k-label">Var.</div>
          <div className="k-val" style={{ color: "#12A594" }}>
            <span className="cnt" data-target={data.variation} data-fmt="pluspctint">
              +{data.variation}%
            </span>
          </div>
          <svg
            aria-hidden="true"
            className="spark"
            viewBox="0 0 60 18"
            width="100%"
            height="18"
            preserveAspectRatio="none"
          >
            <polyline
              className="chart-line"
              pathLength={1}
              points={sparkPoints(index + 3)}
              fill="none"
              stroke="#12A594"
              strokeWidth="1.6"
            />
          </svg>
        </div>
      </div>
      <div className="show-row">
        <div className="show-panel">
          <svg
            aria-hidden="true"
            viewBox="0 0 130 52"
            width="100%"
            height="52"
            preserveAspectRatio="none"
          >
            <path
              d="M0 44 C18 38,26 30,40 32 S64 20,78 24 S104 8,130 12 L130 52 L0 52Z"
              fill={data.c1}
              opacity=".14"
            />
            <path
              className="chart-line"
              pathLength={1}
              d="M0 44 C18 38,26 30,40 32 S64 20,78 24 S104 8,130 12"
              fill="none"
              stroke={data.c1}
              strokeWidth="2"
            />
          </svg>
        </div>
        <div className="show-panel show-ring-wrap">
          <svg aria-hidden="true" viewBox="0 0 42 42" width="46" height="46">
            <circle cx="21" cy="21" r="15.9" fill="none" stroke="#EAF0F8" strokeWidth="6" />
            <circle
              className="chart-donut"
              style={{ ["--seg" as string]: `${data.seg1} ${data.seg2}` }}
              cx="21"
              cy="21"
              r="15.9"
              fill="none"
              stroke={data.c1}
              strokeDasharray={`${data.seg1} ${data.seg2}`}
              strokeDashoffset="25"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <circle
              className="chart-donut"
              style={{ ["--seg" as string]: "24 76" }}
              cx="21"
              cy="21"
              r="15.9"
              fill="none"
              stroke={data.c2}
              strokeDasharray="24 76"
              strokeDashoffset={data.seg3}
              strokeWidth="6"
              strokeLinecap="round"
            />
          </svg>
          <span className="show-ring-label">{data.seg1}%</span>
        </div>
      </div>
      <div className="show-row2">
        <div className="show-panel">
          <svg
            aria-hidden="true"
            viewBox="0 0 70 40"
            width="100%"
            height="40"
            preserveAspectRatio="none"
          >
            {data.stackBars.map(({ j, a, b, x }) => (
              <g key={j}>
                <rect
                  className="chart-bar"
                  style={{ transitionDelay: `${j * 70}ms` }}
                  x={x}
                  y={40 - a - b}
                  width="10"
                  height={a}
                  rx="2"
                  fill={data.c1}
                />
                <rect
                  className="chart-bar"
                  style={{ transitionDelay: `${j * 70 + 40}ms` }}
                  x={x}
                  y={40 - b}
                  width="10"
                  height={b}
                  rx="2"
                  fill={data.c2}
                  opacity=".75"
                />
              </g>
            ))}
          </svg>
        </div>
        <div className="show-panel">
          {data.rows.map((row) => (
            <div className="show-table-row" key={row.name}>
              <span className="avatar" style={{ background: row.color }}>
                {initials(row.name)}
              </span>
              <span className="show-name-cell">{row.name}</span>
              <span className={`badge-status ${row.ok ? "ok" : "warn"}`}>
                {row.ok ? "Ativo" : "Atenção"}
              </span>
              <b>R$&nbsp;{row.value}</b>
            </div>
          ))}
        </div>
      </div>
      <div className="show-footer">
        <div className="show-avatar-group">
          <span className="avatar" style={{ background: "#1F5EFF" }}>
            AP
          </span>
          <span className="avatar" style={{ background: "#25D0C3" }}>
            BS
          </span>
          <span className="avatar" style={{ background: "#081C3A" }}>
            CM
          </span>
        </div>
        <span className="show-updated">Atualizado {data.updated}</span>
      </div>
      <div className="show-name">{area}</div>
    </div>
  );
});

export function DashboardShowcase() {
  const {
    viewportRef,
    trackRef,
    indicatorFillRef,
    setCardRef,
    activeIndex,
    count,
    goPrev,
    goNext,
  } = useDraggableCarousel(SHOWCASE_AREAS.length);

  return (
    <section className="dashsec" id="dashboards">
      <div className="ambient" aria-hidden="true">
        <div
          className="orb orb-blue d1"
          style={{ width: 360, height: 360, top: -90, left: "8%" }}
        />
        <div
          className="orb orb-teal d2"
          style={{ width: 320, height: 320, bottom: -80, right: "6%" }}
        />
        <div className="grid-lines" style={{ opacity: 0.4 }} />
        <div className="noise-layer" />
      </div>
      <Container>
        <Reveal as="h2" className="sec-title">
          Um painel executivo para <span className="accent">cada área</span> do seu negócio
        </Reveal>
        <Reveal as="p" className="sec-sub">
          O dashboard é a parte visível do projeto — o resultado de um trabalho de integração,
          automação e Inteligência Artificial por trás dele.
        </Reveal>
        <Reveal className="show-wrap" delay={1}>
          <button
            type="button"
            className="show-nav show-prev"
            aria-label="Anterior"
            onClick={goPrev}
            style={activeIndex <= 0 ? { opacity: 0.35, pointerEvents: "none" } : undefined}
          >
            <svg
              aria-hidden="true"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <div
            className="show-viewport"
            ref={viewportRef}
            // biome-ignore lint/a11y/noNoninteractiveTabindex: custom carousel widget needs keyboard focus for arrow-key navigation
            tabIndex={0}
            role="region"
            aria-roledescription="carousel"
            aria-label="Carrossel de dashboards por área"
          >
            <div className="show-track" ref={trackRef}>
              {SHOWCASE_AREAS.map((area, i) => (
                <ShowcaseCard key={area} index={i} setCardRef={setCardRef(i)} />
              ))}
            </div>
          </div>
          <button
            type="button"
            className="show-nav show-next"
            aria-label="Próximo"
            onClick={goNext}
            style={activeIndex >= count - 1 ? { opacity: 0.35, pointerEvents: "none" } : undefined}
          >
            <svg
              aria-hidden="true"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="m9 6 6 6-6 6" />
            </svg>
          </button>
        </Reveal>
        <div className="show-indicator">
          <div className="show-indicator-fill" ref={indicatorFillRef} />
        </div>
      </Container>
    </section>
  );
}
