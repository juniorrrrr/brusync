"use client";

import { BrandedAppMockup } from "@/components/dashboard-mock/BrandedAppMockup";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { useParticleField } from "@/hooks/useParticleField";

export function Hero() {
  const particlesRef = useParticleField<HTMLCanvasElement>({
    count: 34,
    speed: 0.16,
    color: "rgba(31,94,255,.5)",
  });

  return (
    <header className="hero">
      <div className="ambient" aria-hidden="true">
        <div
          className="orb orb-blue d1"
          style={{ width: 420, height: 420, top: -140, left: -110 }}
        />
        <div
          className="orb orb-teal d2"
          style={{ width: 360, height: 360, top: 40, right: -150 }}
        />
        <div className="grid-lines" style={{ opacity: 0.6 }} />
      </div>
      {/* biome-ignore lint/a11y/noAriaHiddenOnFocusable: decorative, non-interactive canvas */}
      <canvas className="particles" ref={particlesRef} aria-hidden="true" />
      <div className="hero-dots" />
      <Container className="hero-grid">
        <div className="reveal in">
          <h1>
            Seu negócio merece um software
            <br />
            <span className="accent">feito exclusivamente para ele.</span>
          </h1>
          <p className="sub">
            Desenvolvemos plataformas completas e sob medida para empresas que não cabem mais em
            ferramentas prontas: CRM, dashboards, automações e Inteligência Artificial — tudo com a
            sua marca, o seu domínio e as suas regras de negócio.
          </p>
          <div className="hero-actions">
            <Button href="#contato" withArrow>
              Quero meu software
            </Button>
            <Button href="#processo" variant="outline">
              Ver como construímos
            </Button>
          </div>
          <div className="hero-trust">
            <div className="trust-item">
              <svg
                aria-hidden="true"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              Sistema 100% seu
            </div>
            <div className="trust-item">
              <svg
                aria-hidden="true"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="4" y="10" width="16" height="10" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
              Sua marca, seu domínio
            </div>
            <div className="trust-item">
              <svg
                aria-hidden="true"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
              </svg>
              Sem mensalidade de plataforma pronta
            </div>
          </div>
        </div>

        <BrandedAppMockup />
      </Container>
    </header>
  );
}
