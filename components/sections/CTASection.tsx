"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { useParticleField } from "@/hooks/useParticleField";
import { EVENTS, serializeTrackingContext, trackEvent } from "@/lib/tracking";
import { type LeadFormState, submitLead } from "@/services/leads";

const initialState: LeadFormState = { status: "idle" };
const COOLDOWN_MS = 60_000;
const COOLDOWN_KEY = "brusync_lead_cooldown_until";

function formatCountdown(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function StatusCard({
  variant,
  cooldownMs,
}: {
  variant: "success" | "blocked";
  cooldownMs: number;
}) {
  const isBlocked = variant === "blocked";
  return (
    <div className="cta-status">
      <div className={`cta-status-icon${isBlocked ? " is-blocked" : ""}`} aria-hidden="true">
        {isBlocked ? (
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3.2 2" />
          </svg>
        ) : (
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        )}
      </div>

      <h3>{isBlocked ? "Já recebemos sua solicitação." : "Projeto recebido."}</h3>
      <p>
        {isBlocked
          ? "Nossa equipe já está com as informações do seu envio anterior. Uma nova solicitação pode ser feita em instantes."
          : "Nossa equipe vai analisar o que você enviou e retorna em até um dia útil."}
      </p>

      {cooldownMs > 0 && (
        <div className="cta-status-cooldown">
          <span className="cta-status-dot" />
          {isBlocked ? "Nova solicitação em " : "Próximo envio liberado em "}
          {formatCountdown(cooldownMs)}
        </div>
      )}

      <div className="cta-status-actions">
        <a href="/cases" className="btn btn-outline">
          Conhecer nossos cases
        </a>
        <a href="#processo" className="cta-status-link">
          Ver como funciona o processo →
        </a>
      </div>
    </div>
  );
}

export function CTASection() {
  const particlesRef = useParticleField<HTMLCanvasElement>({
    count: 28,
    speed: 0.14,
    color: "rgba(37,208,195,.5)",
  });
  const [state, formAction, pending] = useActionState(submitLead, initialState);
  const [trackingContext, setTrackingContext] = useState("");
  const [renderedAt, setRenderedAt] = useState(0);
  const trackedSuccessRef = useRef(false);

  const [phase, setPhase] = useState<"form" | "success" | "blocked">("form");
  const [cooldownMs, setCooldownMs] = useState(0);

  useEffect(() => {
    setTrackingContext(serializeTrackingContext());
    setRenderedAt(Date.now());
    const until = Number(window.localStorage.getItem(COOLDOWN_KEY) ?? 0);
    const remaining = until - Date.now();
    if (remaining > 0) {
      setPhase("blocked");
      setCooldownMs(remaining);
    }
  }, []);

  useEffect(() => {
    if (state.status !== "success" || trackedSuccessRef.current) return;
    trackedSuccessRef.current = true;
    trackEvent(EVENTS.CONTACT_SUBMIT);
    trackEvent(EVENTS.GENERATE_LEAD, { source: "contato" });
    window.localStorage.setItem(COOLDOWN_KEY, String(Date.now() + COOLDOWN_MS));
    setCooldownMs(COOLDOWN_MS);
    setPhase("success");
  }, [state.status]);

  useEffect(() => {
    if (phase === "form") return;
    if (cooldownMs <= 0) {
      if (phase === "blocked") setPhase("form");
      return;
    }
    const timer = window.setTimeout(() => setCooldownMs((v) => Math.max(0, v - 1000)), 1000);
    return () => window.clearTimeout(timer);
  }, [phase, cooldownMs]);

  return (
    <section className="cta" id="contato">
      <div className="hairline" aria-hidden="true" />
      {/* biome-ignore lint/a11y/noAriaHiddenOnFocusable: decorative, non-interactive canvas */}
      <canvas className="particles" ref={particlesRef} aria-hidden="true" />
      <Reveal as="div" className="container cta-inner">
        {phase !== "form" ? (
          <StatusCard variant={phase} cooldownMs={cooldownMs} />
        ) : (
          <>
            <h2>
              Seu negócio merece um software
              <br />
              feito exclusivamente para ele.
            </h2>
            <div className="cta-sub">Vamos construir o seu sistema.</div>

            <form className="lead-form" action={formAction}>
              <input type="hidden" name="tracking_context" value={trackingContext} />
              <input type="hidden" name="rendered_at" value={renderedAt} />
              <div className="lead-form-honeypot" aria-hidden="true">
                <label htmlFor="website">Site</label>
                <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
              </div>

              <div className="lead-form-row">
                <div className="lead-form-field">
                  <label htmlFor="name">Nome</label>
                  <input id="name" name="name" type="text" required autoComplete="name" />
                </div>
                <div className="lead-form-field">
                  <label htmlFor="company">Empresa</label>
                  <input
                    id="company"
                    name="company"
                    type="text"
                    required
                    autoComplete="organization"
                  />
                </div>
              </div>
              <div className="lead-form-row">
                <div className="lead-form-field">
                  <label htmlFor="email">E-mail</label>
                  <input id="email" name="email" type="email" required autoComplete="email" />
                </div>
                <div className="lead-form-field">
                  <label htmlFor="phone">Telefone</label>
                  <input id="phone" name="phone" type="tel" autoComplete="tel" />
                </div>
              </div>
              <div className="lead-form-field">
                <label htmlFor="message">O que você gostaria de resolver? (opcional)</label>
                <textarea id="message" name="message" rows={3} />
              </div>

              <button
                type="submit"
                className={`btn btn-accent pulse-btn lead-submit${pending ? " is-loading" : ""}`}
                disabled={pending}
              >
                <span className="lead-submit-label">
                  {pending ? "Enviando" : "Quero meu software"}
                </span>
                <span className="lead-spinner" aria-hidden="true" />
                <span className="sweep" />
              </button>

              {state.status === "error" && (
                <p className="lead-form-status error" role="status">
                  {state.message}
                </p>
              )}
            </form>

            <div className="cta-note">
              Conversa sem compromisso. Sem contrato de fidelidade de plataforma pronta.
            </div>
          </>
        )}
      </Reveal>
    </section>
  );
}
