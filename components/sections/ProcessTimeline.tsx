import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import type { TimelineStep } from "@/types";

const STEPS: TimelineStep[] = [
  {
    number: "01",
    title: "Diagnóstico",
    description:
      "Mapeamos a fundo como a sua empresa opera hoje, e onde ela perde tempo e dinheiro.",
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
    title: "Arquitetura sob medida",
    description:
      "Desenhamos a estrutura do sistema em volta das suas regras de negócio, não o contrário.",
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
        <path d="M12 2 2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Integração de dados",
    description: "Conectamos suas ferramentas atuais para que nenhuma informação fique de fora.",
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
    number: "04",
    title: "Desenvolvimento exclusivo",
    description: "Construímos cada módulo do zero, com a sua marca e a sua identidade visual.",
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
        <path d="m8 6-5 6 5 6M16 6l5 6-5 6" />
      </svg>
    ),
  },
  {
    number: "05",
    title: "Inteligência Artificial",
    description: "Aplicamos IA onde ela realmente resolve um problema da sua operação.",
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
    title: "Testes e ajustes",
    description: "Validamos cada fluxo com a sua equipe antes de qualquer coisa ir ao ar.",
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
  {
    number: "07",
    title: "Deploy no seu domínio",
    description:
      "Colocamos o sistema no ar com o seu domínio e a sua marca, do jeito que deveria ser.",
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
        <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
      </svg>
    ),
  },
  {
    number: "08",
    title: "Evolução contínua",
    description: "O sistema evolui junto com a sua empresa, sempre sob medida.",
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
        <path d="M3 17 9 11l4 4 8-8" />
        <path d="M15 7h6v6" />
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
          Como <span className="accent">construímos</span> o seu sistema
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
