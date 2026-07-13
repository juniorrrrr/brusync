"use client";

import { useActionState } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { useParticleField } from "@/hooks/useParticleField";
import { type LeadFormState, submitLead } from "@/services/leads";

const initialState: LeadFormState = { status: "idle" };

export function CTASection() {
  const particlesRef = useParticleField<HTMLCanvasElement>({
    count: 28,
    speed: 0.14,
    color: "rgba(37,208,195,.5)",
  });
  const [state, formAction, pending] = useActionState(submitLead, initialState);

  return (
    <section className="cta" id="contato">
      <div className="hairline" aria-hidden="true" />
      {/* biome-ignore lint/a11y/noAriaHiddenOnFocusable: decorative, non-interactive canvas */}
      <canvas className="particles" ref={particlesRef} aria-hidden="true" />
      <Reveal as="div" className="container cta-inner">
        <h2>
          Seu negócio merece um software
          <br />
          feito exclusivamente para ele.
        </h2>
        <div className="cta-sub">Vamos construir o seu sistema.</div>

        <form className="lead-form" action={formAction}>
          <div className="lead-form-row">
            <div className="lead-form-field">
              <label htmlFor="name">Nome</label>
              <input id="name" name="name" type="text" required autoComplete="name" />
            </div>
            <div className="lead-form-field">
              <label htmlFor="company">Empresa</label>
              <input id="company" name="company" type="text" required autoComplete="organization" />
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

          <button type="submit" className="btn btn-accent pulse-btn" disabled={pending}>
            {pending ? "Enviando..." : "Quero meu software"}
            <span className="sweep" />
          </button>

          {state.status !== "idle" && (
            <p className={`lead-form-status ${state.status}`} role="status">
              {state.message}
            </p>
          )}
        </form>

        <div className="cta-note">
          Conversa sem compromisso. Sem contrato de fidelidade de plataforma pronta.
        </div>
      </Reveal>
    </section>
  );
}
