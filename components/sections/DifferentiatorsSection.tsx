import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import type { DifferentiatorItem } from "@/types";

const DIFFERENTIATORS: DifferentiatorItem[] = [
  {
    title: "Automação de processos",
    description: "Tarefas manuais e repetitivas passam a rodar sozinhas, sem retrabalho.",
    icon: (
      <svg
        aria-hidden="true"
        width="22"
        height="22"
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
    title: "Integração completa",
    description: "Conectamos APIs, planilhas, CRMs e sistemas internos com segurança.",
    icon: (
      <svg
        aria-hidden="true"
        width="22"
        height="22"
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
    title: "Dados em tempo real",
    description: "Informações atualizadas automaticamente, sem copiar e colar.",
    icon: (
      <svg
        aria-hidden="true"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
      </svg>
    ),
  },
  {
    title: "Inteligência para gestão",
    description: "Menos relatórios. Mais clareza, estratégia e resultado.",
    icon: (
      <svg
        aria-hidden="true"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.7 1 1.5 1 2.5h6c0-1 .2-1.8 1-2.5A6 6 0 0 0 12 3z" />
      </svg>
    ),
  },
];

export function DifferentiatorsSection() {
  return (
    <section className="diff">
      <Container>
        <Reveal as="h2" className="sec-title">
          Por que empresas escolhem a <span className="accent">Brusync?</span>
        </Reveal>
        <div className="diff-grid">
          {DIFFERENTIATORS.map((d, i) => (
            <Reveal
              key={d.title}
              as="div"
              className="diff-card"
              delay={(i + 1) as 1 | 2 | 3 | 4}
              data-spot=""
            >
              <div className="diff-ico">{d.icon}</div>
              <h3>{d.title}</h3>
              <p>{d.description}</p>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
