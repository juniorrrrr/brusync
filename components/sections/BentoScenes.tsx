const BLUEPRINT_CELLS = ["a", "b", "active", "d", "e", "f"];

export function SceneBlueprint() {
  return (
    <div className="bento-scene bento-scene-blueprint" aria-hidden="true">
      {BLUEPRINT_CELLS.map((cell) => (
        <span
          className={cell === "active" ? "bento-bp-cell is-active" : "bento-bp-cell"}
          key={cell}
        />
      ))}
      <span className="bento-bp-cursor" />
    </div>
  );
}

export function SceneWhiteLabel() {
  return (
    <div className="bento-scene bento-scene-label" aria-hidden="true">
      <div className="bento-mini-bar">
        <span />
        <span />
        <span />
      </div>
      <div className="bento-mini-brand">
        <span className="bento-mini-logo" />
        <span className="bento-mini-line" />
      </div>
    </div>
  );
}

export function SceneDomain() {
  return (
    <div className="bento-scene bento-scene-domain" aria-hidden="true">
      <div className="bento-domain-pill">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
        >
          <rect x="5" y="10.5" width="14" height="9.5" rx="2.2" />
          <path d="M8 10.5V7.2a4 4 0 0 1 8 0v3.3" />
        </svg>
        seudominio.com.br
      </div>
      <span className="bento-domain-ping" />
    </div>
  );
}

export function SceneIntegrations() {
  return (
    <div className="bento-scene bento-scene-flow" aria-hidden="true">
      <svg aria-hidden="true" viewBox="0 0 220 120" width="100%" height="100%">
        <g
          className="bento-flow-lines"
          stroke="currentColor"
          strokeWidth="1.4"
          fill="none"
          opacity="0.35"
        >
          <path d="M28 24 L106 60" />
          <path d="M28 96 L106 60" />
          <path d="M192 24 L114 60" />
          <path d="M192 96 L114 60" />
        </g>
        <g className="bento-flow-dash">
          <circle r="2.6" fill="var(--accent)">
            <animateMotion dur="2.6s" repeatCount="indefinite" path="M28 24 L106 60" />
          </circle>
          <circle r="2.6" fill="var(--secondary)">
            <animateMotion dur="3.1s" repeatCount="indefinite" path="M28 96 L106 60" />
          </circle>
          <circle r="2.6" fill="var(--accent)">
            <animateMotion dur="2.9s" repeatCount="indefinite" path="M192 24 L114 60" />
          </circle>
        </g>
        <circle cx="26" cy="24" r="7" className="bento-flow-node" />
        <circle cx="26" cy="96" r="7" className="bento-flow-node" />
        <circle cx="194" cy="24" r="7" className="bento-flow-node" />
        <circle cx="194" cy="96" r="7" className="bento-flow-node" />
        <circle cx="110" cy="60" r="13" className="bento-flow-hub" />
      </svg>
    </div>
  );
}

export function SceneAi() {
  return (
    <div className="bento-scene bento-scene-ai" aria-hidden="true">
      <div className="bento-ai-badge">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
        </svg>
      </div>
      <svg aria-hidden="true" className="bento-ai-spark" viewBox="0 0 60 20" width="60" height="20">
        <path
          d="M2 15 C10 15,10 5,18 5 S26 15,34 15 S42 3,50 3"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="1.8"
        />
      </svg>
    </div>
  );
}
