"use client";

import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { useParticleField } from "@/hooks/useParticleField";

export function CTASection() {
  const particlesRef = useParticleField<HTMLCanvasElement>({
    count: 28,
    speed: 0.14,
    color: "rgba(37,208,195,.5)",
  });

  return (
    <section className="cta" id="contato">
      <div className="hairline" aria-hidden="true" />
      {/* biome-ignore lint/a11y/noAriaHiddenOnFocusable: decorative, non-interactive canvas */}
      <canvas className="particles" ref={particlesRef} aria-hidden="true" />
      <Reveal as="div" className="container cta-inner">
        <h2>
          Pare de abrir cinco sistemas diferentes
          <br />
          para entender sua empresa.
        </h2>
        <div className="cta-sub">Veja tudo em um único dashboard.</div>
        <Button href="#contato" withArrow className="pulse-btn">
          Quero uma demonstração
        </Button>
        <div className="cta-note">Demonstração gratuita e sem compromisso</div>
      </Reveal>
    </section>
  );
}
