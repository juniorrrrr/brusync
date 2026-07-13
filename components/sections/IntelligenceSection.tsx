import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import type { DifferentiatorItem } from "@/types";

const AI_CAPABILITIES: DifferentiatorItem[] = [
  {
    title: "Alertas inteligentes",
    description: "Sua equipe é avisada automaticamente quando um indicador sai do esperado.",
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
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    title: "Detecção automática de anomalias",
    description: "Padrões fora da curva são sinalizados antes de virarem um problema.",
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
        <path d="M12 7.5v5.5l3.5 2" />
      </svg>
    ),
  },
  {
    title: "Resumos executivos",
    description: "Relatórios longos viram um resumo direto, pronto para decisão.",
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
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M8 13h8M8 17h5" />
      </svg>
    ),
  },
  {
    title: "Insights automáticos",
    description: "A cada novo dado, o que realmente importa observar fica em destaque.",
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
  {
    title: "Identificação de oportunidades",
    description: "Cruzamos seus dados para revelar onde há espaço para crescer.",
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
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    title: "Previsão de metas",
    description: "Projeções baseadas em dados reais, não em achismo.",
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
        <path d="M3 17 9 11l4 4 8-8" />
        <path d="M15 7h6v6" />
      </svg>
    ),
  },
  {
    title: "Recomendações baseadas em dados",
    description: "O próximo passo é sugerido com base no que já aconteceu.",
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
        <path d="m9 11 3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    title: "Perguntas em linguagem natural",
    description: "Sua equipe pergunta em português simples e recebe a resposta pronta.",
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
        <path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5c-1.5 0-3-.4-4.2-1.1L3 20l1.1-5.3A8.4 8.4 0 0 1 3 11.5 8.4 8.4 0 0 1 11.5 3a8.4 8.4 0 0 1 9.5 8.5z" />
      </svg>
    ),
  },
];

export function IntelligenceSection() {
  return (
    <section className="ia" id="ia">
      <Container>
        <Reveal as="h2" className="sec-title">
          Inteligência Artificial <span className="accent">a favor do seu negócio</span>
        </Reveal>
        <Reveal className="sec-sub" as="p">
          O dashboard mostra o que aconteceu. A IA mostra o que fazer a respeito.
        </Reveal>
        <div className="ia-grid">
          {AI_CAPABILITIES.map((item, i) => (
            <Reveal
              key={item.title}
              as="div"
              className="ia-card"
              delay={((i % 5) + 1) as 1 | 2 | 3 | 4 | 5}
            >
              <div className="ia-ico">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
