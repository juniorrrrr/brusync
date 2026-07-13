import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import type { TimelineStep } from "@/types";

const STEPS: TimelineStep[] = [
  {
    number: "01",
    title: "Diagnóstico",
    description: "Mapeamos onde seus dados estão, como fluem e onde sua empresa perde tempo.",
    icon: (
      <svg
        aria-hidden="true"
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Integração",
    description: "Conectamos anúncios, CRM, ERP e planilhas em um único fluxo de dados.",
    icon: (
      <svg
        aria-hidden="true"
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
        <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Centralização",
    description: "Toda a informação passa a viver em um só lugar, sem versões soltas em planilhas.",
    icon: (
      <svg
        aria-hidden="true"
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <ellipse cx="12" cy="5.5" rx="8" ry="3" />
        <path d="M4 5.5V12c0 1.7 3.6 3 8 3s8-1.3 8-3V5.5" />
        <path d="M4 12v6.5c0 1.7 3.6 3 8 3s8-1.3 8-3V12" />
      </svg>
    ),
  },
  {
    number: "04",
    title: "Automação",
    description: "O trabalho manual e repetitivo sai da rotina da sua equipe e roda sozinho.",
    icon: (
      <svg
        aria-hidden="true"
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
      </svg>
    ),
  },
  {
    number: "05",
    title: "Inteligência Artificial",
    description: "Aplicamos IA para identificar padrões, anomalias e oportunidades.",
    icon: (
      <svg
        aria-hidden="true"
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.7 1 1.5 1 2.5h6c0-1 .2-1.8 1-2.5A6 6 0 0 0 12 3z" />
      </svg>
    ),
  },
  {
    number: "06",
    title: "Indicadores",
    description: "As métricas que realmente importam para o crescimento entram no radar da gestão.",
    icon: (
      <svg
        aria-hidden="true"
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M9 11H3v10h6zM15 3H9v18h6zM21 7h-6v14h6z" />
      </svg>
    ),
  },
  {
    number: "07",
    title: "Dashboard Executivo",
    description: "Painéis visuais, intuitivos e sob medida chegam para a sua gestão.",
    icon: (
      <svg
        aria-hidden="true"
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="3" width="18" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
  },
  {
    number: "08",
    title: "Tomada de decisão",
    description: "Sua equipe decide com mais rapidez, confiança e menos achismo.",
    icon: (
      <svg
        aria-hidden="true"
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="m8.5 12.5 2.5 2.5 4.5-5" />
      </svg>
    ),
  },
];

const DELAYS: (1 | 2 | 3 | 4 | 5)[] = [1, 2, 3, 4, 1, 2, 3, 4];

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
