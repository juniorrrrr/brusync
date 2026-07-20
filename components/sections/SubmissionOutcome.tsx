const TIMELINE = [
  { label: "Análise inicial", detail: "Revisamos o que você enviou." },
  { label: "Definição técnica", detail: "Mapeamos escopo e arquitetura." },
  { label: "Contato da equipe", detail: "Alinhamos os próximos passos com você." },
];

function formatCountdown(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function SubmissionOutcome({
  variant,
  cooldownMs,
}: {
  variant: "success" | "blocked";
  cooldownMs: number;
}) {
  const blocked = variant === "blocked";

  return (
    <div className="outcome">
      <div className="outcome-eyebrow">
        {blocked ? "Já está com a gente" : "Solicitação enviada"}
      </div>
      <h3 className="outcome-title">
        {blocked ? "Seu projeto já está em análise." : "Recebemos o seu projeto."}
      </h3>
      <p className="outcome-text">
        {blocked
          ? "Não é necessário enviar de novo. O que você mandou antes já está com a nossa equipe."
          : "Nossa equipe entra em contato em até um dia útil com os próximos passos."}
      </p>

      <ol className="outcome-timeline">
        {TIMELINE.map((step, i) => (
          <li className="outcome-step" key={step.label}>
            <span className="outcome-step-marker" data-active={i === 0 ? "" : undefined} />
            <div>
              <div className="outcome-step-label">{step.label}</div>
              <div className="outcome-step-detail">{step.detail}</div>
            </div>
          </li>
        ))}
      </ol>

      <div className="outcome-links">
        <a href="/cases" className="outcome-card">
          <span className="outcome-card-label">Cases</span>
          <span className="outcome-card-text">Como outras empresas usam a Brusync</span>
          <span className="outcome-card-arrow" aria-hidden="true">
            →
          </span>
        </a>
        <a href="#processo" className="outcome-card">
          <span className="outcome-card-label">Processo</span>
          <span className="outcome-card-text">Como construímos o seu sistema</span>
          <span className="outcome-card-arrow" aria-hidden="true">
            →
          </span>
        </a>
      </div>

      {cooldownMs > 0 && (
        <div className="outcome-footnote">
          Novo envio disponível em {formatCountdown(cooldownMs)}
        </div>
      )}
    </div>
  );
}
