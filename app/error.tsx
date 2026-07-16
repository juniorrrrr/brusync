"use client";

import { useEffect } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled application error", error);
  }, [error]);

  return (
    <PageShell>
      <header className="page-hero">
        <div className="ambient" aria-hidden="true">
          <div
            className="orb orb-blue d1"
            style={{ width: 340, height: 340, top: -110, left: -100 }}
          />
          <div
            className="orb orb-teal d2"
            style={{ width: 300, height: 300, top: 10, right: -120 }}
          />
        </div>
        <Container className="page-hero-inner">
          <div className="reveal in">
            <span className="page-hero-eyebrow">Erro inesperado</span>
            <h1>Algo deu errado.</h1>
            <p className="page-hero-desc">
              Não foi possível carregar esta página agora. Tente novamente em instantes.
            </p>
            <div className="page-hero-cta multi">
              <button type="button" className="btn btn-accent pulse-btn" onClick={reset}>
                Tentar novamente
                <span className="sweep" />
              </button>
              <Button href="/" variant="outline">
                Voltar para o início
              </Button>
            </div>
          </div>
        </Container>
      </header>
    </PageShell>
  );
}
