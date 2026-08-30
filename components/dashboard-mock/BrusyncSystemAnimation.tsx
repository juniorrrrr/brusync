"use client";

import { Archivo } from "next/font/google";
import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { useTilt } from "@/hooks/useTilt";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-archivo",
  display: "swap",
});

/* ---------- tween helpers ---------- */

const Easing = {
  easeOutCubic: (t: number) => --t * t * t + 1,
  easeInOutCubic: (t: number) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

type Tween = {
  from?: number;
  to?: number;
  start?: number;
  end?: number;
  ease?: (t: number) => number;
};

function animate({ from = 0, to = 1, start = 0, end = 1, ease = Easing.easeInOutCubic }: Tween) {
  return (t: number) => {
    if (t <= start) return from;
    if (t >= end) return to;
    return from + (to - from) * ease((t - start) / (end - start));
  };
}

const MOTION = {
  enter: (o: Tween) => animate({ ease: Easing.easeOutCubic, ...o }),
  draw: (o: Tween) => animate({ ease: Easing.easeInOutCubic, ...o }),
};

/* ---------- scene timeline ---------- */
// Every authored scene runs at its own natural duration (no speed trims), so
// authored time T tracks elapsed time 1:1 — no warp step is needed here.
const SCENES: Array<{ name: string; dur: number }> = [
  { name: "Abertura", dur: 2 },
  { name: "Dashboard", dur: 1.9 },
  { name: "CRM", dur: 1.9 },
  { name: "ERP", dur: 1.9 },
  { name: "Financeiro", dur: 1.9 },
  { name: "BI", dur: 1.9 },
  { name: "IA", dur: 1.9 },
  { name: "RH", dur: 1.9 },
  { name: "Fecho", dur: 2.8 },
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
const DOMAIN = "app.suaempresa.com.br";
const CLOSING = "Sua operação. Seus dados. Sua inteligência. Tudo conectado.";

const C = {
  bg: "#141110",
  chrome: "#1d1a18",
  rule: "#332e2b",
  surface: "#1a1716",
  ink: "#f3f2f2",
  dim: "#948c88",
  faint: "#5d5651",
  accent: "#0000ff",
};

const ORDER = ["Dashboard", "CRM", "ERP", "Financeiro", "BI", "IA", "RH"] as const;

type PanelKind = "bars" | "funnel" | "table" | "line" | "heat" | "agents" | "people";

type ModuleDef = {
  nav: string;
  title: string;
  benefit: string;
  kpis: Array<[string, string, string]>;
  panel: PanelKind;
};

const MODULES: Record<(typeof ORDER)[number], ModuleDef> = {
  Dashboard: {
    nav: "Dashboard Executivo",
    title: "Dashboard Executivo",
    benefit: "Os indicadores que decidem, num só lugar.",
    kpis: [
      ["Faturamento", "R$ 1,86M", "+22,4%"],
      ["Lucro", "R$ 372K", "+12,4%"],
      ["Clientes ativos", "3.240", "+9,8%"],
      ["Eficiência", "41%", "+6,2%"],
    ],
    panel: "bars",
  },
  CRM: {
    nav: "CRM",
    title: "CRM Personalizado",
    benefit: "Seu funil, com as suas etapas — não as de um software genérico.",
    kpis: [
      ["Oportunidades", "1.487", "+15,3%"],
      ["Ticket médio", "R$ 18,4K", "+4,1%"],
      ["Conversão", "23,6%", "+3,4%"],
      ["Ciclo de venda", "21 dias", "−5 dias"],
    ],
    panel: "funnel",
  },
  ERP: {
    nav: "Operações / ERP",
    title: "ERP e Operações",
    benefit: "Pedidos, estoque e produção sob as suas regras.",
    kpis: [
      ["Ordens abertas", "318", "+7,2%"],
      ["OEE", "87,4%", "+2,8%"],
      ["Estoque", "R$ 942K", "−3,1%"],
      ["Entregas no prazo", "96%", "+1,9%"],
    ],
    panel: "table",
  },
  Financeiro: {
    nav: "Financeiro",
    title: "Portal Financeiro",
    benefit: "Receita, custo e margem atualizados, sem planilha paralela.",
    kpis: [
      ["Receita", "R$ 2,41M", "+18,6%"],
      ["Margem", "31,8%", "+2,2%"],
      ["A receber", "R$ 486K", "−8,4%"],
      ["Fluxo de caixa", "R$ 712K", "+11,0%"],
    ],
    panel: "line",
  },
  BI: {
    nav: "Business Intelligence",
    title: "Business Intelligence",
    benefit: "Cruze os dados de toda a empresa e veja o que ninguém vê.",
    kpis: [
      ["Fontes conectadas", "14", "ativas"],
      ["Registros/dia", "2,4M", "+19,7%"],
      ["ROAS", "4,32", "+8,1%"],
      ["Latência", "1,2s", "−0,4s"],
    ],
    panel: "heat",
  },
  IA: {
    nav: "Agentes de IA",
    title: "Agentes de IA",
    benefit: "Inteligência trabalhando dentro do seu próprio sistema.",
    kpis: [
      ["Agentes ativos", "6", "on-line"],
      ["Tarefas hoje", "1.902", "+26,5%"],
      ["Horas poupadas", "184", "+14,3%"],
      ["Precisão", "98,1%", "+0,7%"],
    ],
    panel: "agents",
  },
  RH: {
    nav: "RH",
    title: "Portal RH",
    benefit: "Gestão de pessoas num ambiente feito para a sua cultura.",
    kpis: [
      ["Colaboradores", "412", "+3,4%"],
      ["Turnover", "6,8%", "−1,6%"],
      ["Admissões", "18", "no mês"],
      ["eNPS", "74", "+9"],
    ],
    panel: "people",
  },
};

/* ---------- primitives ---------- */

function Rule({ style }: { style?: CSSProperties }) {
  return <div style={{ height: 2, background: C.rule, ...style }} />;
}

function Label({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        fontSize: 13,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: C.faint,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Kpis({ items, p }: { items: Array<[string, string, string]>; p: number }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        borderTop: `2px solid ${C.rule}`,
        borderBottom: `2px solid ${C.rule}`,
      }}
    >
      {items.map(([label, value, delta], i) => {
        const a = clamp(p * 1.9 - i * 0.12, 0, 1);
        return (
          <div
            key={label}
            style={{
              padding: "20px 24px",
              borderLeft: i ? `2px solid ${C.rule}` : "none",
              opacity: 0.25 + 0.75 * a,
            }}
          >
            <Label>{label}</Label>
            <div
              style={{
                fontSize: 34,
                fontWeight: 600,
                color: C.ink,
                marginTop: 10,
                letterSpacing: "-0.02em",
                clipPath: `inset(0 ${(1 - a) * 100}% 0 0)`,
              }}
            >
              {value}
            </div>
            <div style={{ fontSize: 14, color: C.accent, marginTop: 6, opacity: a }}>{delta}</div>
          </div>
        );
      })}
    </div>
  );
}

function Bars({ p }: { p: number }) {
  const h = [0.42, 0.55, 0.48, 0.68, 0.61, 0.79, 0.72, 0.9, 0.84, 1, 0.93, 0.88];
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "flex-end", height: "100%" }}>
      {h.map((v, i) => {
        const a = clamp(p * 1.6 - i * 0.045, 0, 1);
        return (
          <div
            key={`bar-${v}`}
            style={{
              flex: 1,
              height: `${v * 100 * Easing.easeOutCubic(a)}%`,
              background: i === 9 ? C.accent : "#3a3431",
            }}
          />
        );
      })}
    </div>
  );
}

function Funnel({ p }: { p: number }) {
  const st: Array<[string, number, number]> = [
    ["Lead", 1487, 1],
    ["Qualificado", 812, 0.72],
    ["Proposta", 431, 0.5],
    ["Negociação", 246, 0.34],
    ["Fechado", 118, 0.2],
  ];
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        height: "100%",
        justifyContent: "center",
      }}
    >
      {st.map(([name, n, w], i) => {
        const a = Easing.easeInOutCubic(clamp(p * 1.7 - i * 0.13, 0, 1));
        return (
          <div key={name} style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ width: 150, fontSize: 15, color: C.dim }}>{name}</div>
            <div style={{ flex: 1, height: 34, background: "#221f1d" }}>
              <div
                style={{
                  width: `${w * 100 * a}%`,
                  height: "100%",
                  background: i === 4 ? C.accent : "#3a3431",
                }}
              />
            </div>
            <div style={{ width: 90, textAlign: "right", fontSize: 18, color: C.ink, opacity: a }}>
              {Math.round(n * a)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Table({ p }: { p: number }) {
  const rows = [
    ["#48210", "Metalúrgica Vale", "Produção", "1.200 un", "No prazo"],
    ["#48211", "Distribuidora Sul", "Expedição", "840 un", "No prazo"],
    ["#48212", "Têxtil Brusque", "Corte", "2.400 un", "Atenção"],
    ["#48213", "Alimentos Norte", "Faturado", "560 un", "No prazo"],
    ["#48214", "Móveis Central", "Separação", "1.080 un", "No prazo"],
  ];
  return (
    <div style={{ height: "100%" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "110px 1fr 160px 130px 130px",
          padding: "0 0 12px",
          borderBottom: `2px solid ${C.rule}`,
        }}
      >
        {["OS", "Cliente", "Etapa", "Volume", "Status"].map((h) => (
          <Label key={h}>{h}</Label>
        ))}
      </div>
      {rows.map((r, i) => {
        const a = clamp(p * 1.8 - i * 0.14, 0, 1);
        return (
          <div
            key={r[0]}
            style={{
              display: "grid",
              gridTemplateColumns: "110px 1fr 160px 130px 130px",
              padding: "17px 0",
              borderBottom: `1px solid ${C.rule}`,
              opacity: a,
              transform: `translateX(${(1 - a) * 18}px)`,
            }}
          >
            {r.map((cell, j) => (
              <div
                key={`${r[0]}-${cell}`}
                style={{
                  fontSize: 16,
                  color: j === 4 ? (cell === "Atenção" ? C.accent : C.dim) : C.ink,
                }}
              >
                {cell}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function LineArea({ p }: { p: number }) {
  const d = [0.32, 0.38, 0.34, 0.46, 0.52, 0.49, 0.6, 0.66, 0.63, 0.75, 0.82, 0.94];
  const W = 1000;
  const H = 260;
  const pts = d.map((v, i): [number, number] => [(i / (d.length - 1)) * W, H - v * H]);
  const path = pts.map((q, i) => `${i ? "L" : "M"}${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(" ");
  const a = Easing.easeInOutCubic(clamp(p * 1.5, 0, 1));
  const last = pts[pts.length - 1];
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ width: "100%", height: "100%" }}
    >
      <title>Receita</title>
      {[0.25, 0.5, 0.75].map((g) => (
        <line key={g} x1="0" x2={W} y1={H * g} y2={H * g} stroke={C.rule} strokeWidth="2" />
      ))}
      <path
        d={`${path} L${W},${H} L0,${H} Z`}
        fill="#241f1d"
        opacity={a}
        style={{ clipPath: `inset(0 ${(1 - a) * 100}% 0 0)` }}
      />
      <path
        d={path}
        fill="none"
        stroke={C.accent}
        strokeWidth="4"
        pathLength={1}
        strokeDasharray="1"
        strokeDashoffset={1 - a}
      />
      <circle
        cx={last[0] - 4}
        cy={last[1]}
        r="7"
        fill={C.accent}
        opacity={clamp((a - 0.9) * 10, 0, 1)}
      />
    </svg>
  );
}

function Heat({ p }: { p: number }) {
  const cols = 16;
  const rows = 6;
  const cells: ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const v = (Math.sin(r * 1.7 + c * 0.9) + Math.cos(c * 0.5 - r) + 2) / 4;
      const a = clamp(p * 2.1 - (c / cols) * 0.9 - (r / rows) * 0.25, 0, 1);
      cells.push(
        <div
          key={`${r}-${c}`}
          style={{ background: v > 0.72 ? C.accent : "#3a3431", opacity: (0.18 + v * 0.82) * a }}
        />,
      );
    }
  }
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridAutoRows: "1fr",
        gap: 8,
        height: "100%",
      }}
    >
      {cells}
    </div>
  );
}

function Agents({ p }: { p: number }) {
  const msgs: Array<[string, string]> = [
    ["Agente · Vendas", "Três propostas acima de R$ 80K estão paradas há 6 dias."],
    ["Agente · Financeiro", "Margem do canal Marketplace caiu 2,4 p.p. nesta semana."],
    ["Agente · Operações", "Ordem #48212 vai atrasar. Sugeri realocar dois turnos."],
  ];
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        height: "100%",
        justifyContent: "center",
      }}
    >
      {msgs.map(([who, text], i) => {
        const a = Easing.easeOutCubic(clamp(p * 1.8 - i * 0.22, 0, 1));
        return (
          <div
            key={who}
            style={{
              display: "flex",
              gap: 18,
              alignItems: "flex-start",
              opacity: a,
              transform: `translateY(${(1 - a) * 16}px)`,
            }}
          >
            <div style={{ width: 6, alignSelf: "stretch", background: C.accent }} />
            <div style={{ flex: 1, background: "#221f1d", padding: "18px 22px" }}>
              <Label style={{ color: C.accent }}>{who}</Label>
              <div
                style={{
                  fontSize: 19,
                  color: C.ink,
                  marginTop: 8,
                  clipPath: `inset(0 ${(1 - clamp(a * 1.4 - 0.2, 0, 1)) * 100}% 0 0)`,
                }}
              >
                {text}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function People({ p }: { p: number }) {
  const team: Array<[string, string, string]> = [
    ["AP", "Ana Paula", "Comercial"],
    ["BS", "Bruno Silva", "Produção"],
    ["CM", "Carla Mendes", "Financeiro"],
    ["DR", "Diego Rocha", "Logística"],
    ["EF", "Elisa Franco", "Marketing"],
    ["GT", "Gustavo Tavares", "TI"],
    ["HL", "Helena Lopes", "RH"],
    ["IM", "Ivan Moraes", "Qualidade"],
  ];
  return (
    <div
      style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, height: "100%" }}
    >
      {team.map(([initials, name, area], i) => {
        const a = Easing.easeOutCubic(clamp(p * 2 - i * 0.09, 0, 1));
        return (
          <div
            key={name}
            style={{
              background: "#221f1d",
              padding: 18,
              display: "flex",
              gap: 14,
              alignItems: "center",
              opacity: a,
              transform: `scale(${0.94 + 0.06 * a})`,
            }}
          >
            <div
              style={{
                width: 46,
                height: 46,
                background: i % 3 === 0 ? C.accent : "#3a3431",
                color: C.ink,
                display: "grid",
                placeItems: "center",
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              {initials}
            </div>
            <div>
              <div style={{ fontSize: 16, color: C.ink }}>{name}</div>
              <div style={{ fontSize: 13, color: C.faint, marginTop: 3 }}>{area}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const PANELS: Record<PanelKind, (props: { p: number }) => ReactNode> = {
  bars: Bars,
  funnel: Funnel,
  table: Table,
  line: LineArea,
  heat: Heat,
  agents: Agents,
  people: People,
};

/* ---------- the piece ---------- */

function SystemWindow({ T }: { T: number }) {
  const starts = ORDER.map((n) => CUES[n]);
  const ends = starts.slice(1).concat([CUES.Fecho]);

  const winOp = MOTION.enter({ from: 0, to: 1, start: 0.15, end: 0.9 })(T);
  const winY = MOTION.enter({ from: 34, to: 0, start: 0.15, end: 1.1 })(T);
  const outOp =
    1 - MOTION.draw({ from: 0, to: 1, start: CUES.Fecho - 0.15, end: CUES.Fecho + 0.5 })(T);
  const outY = -MOTION.draw({ from: 0, to: 46, start: CUES.Fecho - 0.15, end: CUES.Fecho + 0.6 })(
    T,
  );
  const typed = DOMAIN.slice(
    0,
    Math.round(DOMAIN.length * MOTION.draw({ from: 0, to: 1, start: 0.35, end: 1.25 })(T)),
  );

  let f = 0;
  for (const s of starts) {
    f += Easing.easeInOutCubic(clamp((T - s + 0.2) / 0.5, 0, 1));
  }
  const idxF = clamp(f - 1, 0, ORDER.length - 1);
  const active = Math.round(idxF);

  const camScale =
    1 +
    MOTION.draw({ from: 0, to: 0.028, start: 0.2, end: CUES.Fecho })(T) -
    MOTION.draw({ from: 0, to: 0.028, start: CUES.Fecho, end: CUES.Fecho + 0.8 })(T);

  const closeIn = MOTION.enter({ from: 0, to: 1, start: CUES.Fecho + 0.35, end: CUES.Fecho + 1.3 })(
    T,
  );
  const closeOut =
    1 - MOTION.draw({ from: 0, to: 1, start: TOTAL_DURATION - 0.45, end: TOTAL_DURATION })(T);

  const navRowH = 52;

  return (
    <div style={{ position: "absolute", inset: 0, background: C.bg, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.5,
          backgroundImage: `linear-gradient(${C.chrome} 2px, transparent 2px), linear-gradient(90deg, ${C.chrome} 2px, transparent 2px)`,
          backgroundSize: "80px 80px",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 110,
          top: 78,
          width: 1380,
          height: 744,
          opacity: winOp * outOp,
          transform: `translateY(${winY + outY}px) scale(${camScale})`,
          transformOrigin: "50% 40%",
          background: C.chrome,
          border: `2px solid ${C.rule}`,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            padding: "0 24px",
            height: 60,
            borderBottom: `2px solid ${C.rule}`,
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ width: 10, height: 10, background: C.faint }} />
            ))}
          </div>
          <div
            style={{
              flex: 1,
              background: C.surface,
              border: `2px solid ${C.rule}`,
              padding: "7px 14px",
              fontSize: 15,
              color: C.dim,
              letterSpacing: "0.01em",
            }}
          >
            {typed}
            <span style={{ opacity: typed.length < DOMAIN.length ? 1 : 0, color: C.accent }}>
              |
            </span>
          </div>
          <Label>Sistema 100% seu</Label>
        </div>

        <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
          <div
            style={{
              width: 268,
              borderRight: `2px solid ${C.rule}`,
              padding: "26px 0",
              flexShrink: 0,
              position: "relative",
            }}
          >
            <div
              style={{
                padding: "0 24px 22px",
                fontSize: 22,
                fontWeight: 700,
                color: C.ink,
                letterSpacing: "-0.01em",
              }}
            >
              {BRAND}
              <span style={{ color: C.accent }}>.</span>
            </div>
            <Rule style={{ margin: "0 0 18px" }} />
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 26 + 44 + 18 + idxF * navRowH,
                width: "100%",
                height: navRowH,
                background: C.surface,
                borderLeft: `4px solid ${C.accent}`,
              }}
            />
            {ORDER.map((k, i) => (
              <div
                key={k}
                style={{
                  position: "relative",
                  height: navRowH,
                  display: "flex",
                  alignItems: "center",
                  padding: "0 24px",
                  fontSize: 16,
                  color: i === active ? C.ink : C.faint,
                }}
              >
                {MODULES[k].nav}
              </div>
            ))}
          </div>

          <div style={{ flex: 1, position: "relative", minWidth: 0 }}>
            {ORDER.map((k, i) => {
              const m = MODULES[k];
              const s = i === 0 ? starts[i] - 1.05 : starts[i];
              const inA = Easing.easeOutCubic(clamp((T - s + 0.1) / 0.4, 0, 1));
              const outA = Easing.easeInOutCubic(clamp((T - ends[i] + 0.08) / 0.32, 0, 1));
              const op = inA * (1 - outA);
              if (op <= 0.001) return null;
              const p = clamp((T - starts[i]) / Math.max(0.4, ends[i] - starts[i]), 0, 1);
              const Panel = PANELS[m.panel];
              return (
                <div
                  key={k}
                  style={{
                    position: "absolute",
                    inset: 0,
                    padding: "30px 34px 34px",
                    display: "flex",
                    flexDirection: "column",
                    opacity: op,
                    transform: `translateY(${(1 - inA) * 26 - outA * 26}px)`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-end",
                      justifyContent: "space-between",
                      gap: 24,
                      marginBottom: 20,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 38,
                          fontWeight: 700,
                          color: C.ink,
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {m.title}
                      </div>
                      <div style={{ fontSize: 19, color: C.dim, marginTop: 8, maxWidth: 720 }}>
                        {m.benefit}
                      </div>
                    </div>
                    <Label style={{ whiteSpace: "nowrap" }}>
                      {String(i + 1).padStart(2, "0")} / {String(ORDER.length).padStart(2, "0")}
                    </Label>
                  </div>
                  <Kpis items={m.kpis} p={p} />
                  <div style={{ flex: 1, minHeight: 0, paddingTop: 28 }}>
                    <Panel p={p} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 110,
          top: 0,
          width: 1380,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          opacity: closeIn * closeOut,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            width: 120,
            height: 6,
            background: C.accent,
            marginBottom: 34,
            transform: `scaleX(${closeIn})`,
            transformOrigin: "left",
          }}
        />
        <div
          style={{
            fontSize: 74,
            fontWeight: 700,
            color: C.ink,
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
            maxWidth: 1180,
            transform: `translateY(${(1 - closeIn) * 22}px)`,
          }}
        >
          {CLOSING}
        </div>
        <Rule style={{ margin: "46px 0 26px", width: 1180 }} />
        <div style={{ display: "flex", alignItems: "baseline", gap: 28, flexWrap: "wrap" }}>
          <div style={{ fontSize: 34, fontWeight: 700, color: C.ink }}>
            {BRAND}
            <span style={{ color: C.accent }}>.</span>
          </div>
          <Label style={{ fontSize: 15 }}>Softwares personalizados para o seu negócio</Label>
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
      setTime(CUES.Dashboard + 1);
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

export function BrusyncSystemAnimation() {
  const tiltRef = useTilt<HTMLDivElement>();
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
    <div className="dash-glow brusync-anim-wrap">
      <div className={`brusync-anim-frame ${archivo.variable}`} data-tilt ref={tiltRef}>
        <div className="brusync-anim-stage" ref={stageRef}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: STAGE_WIDTH,
              height: STAGE_HEIGHT,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              fontFamily: "var(--font-archivo), sans-serif",
            }}
          >
            <SystemWindow T={T} />
          </div>
        </div>
      </div>
    </div>
  );
}
