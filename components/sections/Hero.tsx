"use client";

import { DataFlowMockup } from "@/components/dashboard-mock/DataFlowMockup";
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
            Sua empresa já tem dados.
            <br />
            <span className="accent">O que falta é inteligência sobre eles.</span>
          </h1>
          <p className="sub">
            Integramos suas ferramentas, automatizamos processos manuais e aplicamos Inteligência
            Artificial para transformar dados dispersos em indicadores estratégicos. O dashboard é
            só a parte visível do projeto.
          </p>
          <div className="hero-actions">
            <Button href="#contato" withArrow>
              Solicitar diagnóstico
            </Button>
            <Button href="#processo" variant="outline">
              Ver como funciona
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
                <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
              </svg>
              Integração e automação
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
              Inteligência Artificial aplicada
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
                <rect x="3" y="3" width="8" height="8" rx="1.5" />
                <rect x="13" y="3" width="8" height="5" rx="1.5" />
                <rect x="13" y="11" width="8" height="10" rx="1.5" />
                <rect x="3" y="14" width="8" height="7" rx="1.5" />
              </svg>
              Projeto sob medida
            </div>
          </div>
        </div>

        <DataFlowMockup />
      </Container>
    </header>
  );
}
