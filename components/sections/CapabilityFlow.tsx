import type { ReactNode } from "react";

interface Capability {
  label: string;
  icon: ReactNode;
}

const CAPABILITIES: Capability[] = [
  {
    label: "Plataforma única",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2 2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    label: "CRM integrado",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
      </svg>
    ),
  },
  {
    label: "Automação",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
      </svg>
    ),
  },
  {
    label: "Agentes de IA",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.7 1 1.5 1 2.5h6c0-1 .2-1.8 1-2.5A6 6 0 0 0 12 3z" />
      </svg>
    ),
  },
  {
    label: "Indicadores em tempo real",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 11H3v10h6zM15 3H9v18h6zM21 7h-6v14h6z" />
      </svg>
    ),
  },
];

/** Compact "capability strip": a thin connecting line with a faint traveling
 * highlight runs behind five icon+label nodes, reading as a small live
 * extension of the data-flow diagram above rather than a separate block.
 * Icon and label stay paired in one node so mobile wrapping never splits
 * them out of alignment. */
export function CapabilityFlow() {
  return (
    <div className="cap-strip">
      <div className="cap-strip-row">
        <span className="cap-strip-line" aria-hidden="true">
          <span className="cap-strip-beam" />
        </span>
        {CAPABILITIES.map((item, i) => (
          <div className="cap-node" key={item.label} style={{ ["--i" as string]: i }}>
            <span className="cap-node-icon">
              {item.icon}
              <span className="cap-node-dot" aria-hidden="true" />
            </span>
            <span className="cap-node-label">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
