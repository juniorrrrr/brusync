import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import type { TimelineStep } from "@/types";

const STEPS: TimelineStep[] = [
  {
    number: "01",
    title: (
      <>
        Entendemos
        <br />
        seu negócio
      </>
    ),
    description: "Mapeamos seus desafios, objetivos e indicadores mais importantes.",
    icon: (
      <svg
        aria-hidden="true"
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </svg>
    ),
  },
  {
    number: "02",
    title: (
      <>
        Mapeamos seus
        <br />
        indicadores
      </>
    ),
    description: "Definimos juntos as métricas que realmente importam para o crescimento.",
    icon: (
      <svg
        aria-hidden="true"
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M9 11H3v10h6zM15 3H9v18h6zM21 7h-6v14h6z" />
      </svg>
    ),
  },
  {
    number: "03",
    title: (
      <>
        Integramos os
        <br />
        sistemas
      </>
    ),
    description: "Conectamos suas plataformas e transformamos dados em informação.",
    icon: (
      <svg
        aria-hidden="true"
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
        <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
      </svg>
    ),
  },
  {
    number: "04",
    title: (
      <>
        Criamos seu
        <br />
        dashboard
      </>
    ),
    description: "Desenvolvemos painéis intuitivos, visuais e 100% personalizados.",
    icon: (
      <svg
        aria-hidden="true"
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <rect x="3" y="3" width="18" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
  },
  {
    number: "05",
    title: (
      <>
        Treinamos sua
        <br />
        equipe
      </>
    ),
    description: "Capacitamos seu time para usar os dashboards com autonomia e confiança.",
    icon: (
      <svg
        aria-hidden="true"
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M22 10 12 5 2 10l10 5 10-5zM6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" />
      </svg>
    ),
  },
  {
    number: "06",
    title: (
      <>
        Suporte
        <br />
        contínuo
      </>
    ),
    description: "Acompanhamento próximo para evoluir seus dados e resultados.",
    icon: (
      <svg
        aria-hidden="true"
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5c-1.5 0-3-.4-4.2-1.1L3 20l1.1-5.3A8.4 8.4 0 0 1 3 11.5 8.4 8.4 0 0 1 11.5 3a8.4 8.4 0 0 1 9.5 8.5z" />
      </svg>
    ),
  },
];

const DELAYS: (1 | 2 | 3 | 4 | 5)[] = [1, 2, 3, 4, 5, 5];

export function ProcessTimeline() {
  return (
    <section className="process" id="processo">
      <Container>
        <Reveal as="h2" className="sec-title">
          Como <span className="accent">funciona</span> nosso processo
        </Reveal>
        <Reveal as="div" className="tl">
          {STEPS.map((step, i) => (
            <Reveal key={step.number} as="div" className="tl-step" delay={DELAYS[i]}>
              <div className="tl-num">{step.number}</div>
              <div className="tl-ico">{step.icon}</div>
              <h4>{step.title}</h4>
              <p>{step.description}</p>
            </Reveal>
          ))}
        </Reveal>
      </Container>
    </section>
  );
}
