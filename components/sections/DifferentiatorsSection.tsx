import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import type { DifferentiatorItem } from "@/types";

interface BentoItem extends DifferentiatorItem {
  featured?: boolean;
}

const DIFFERENTIATORS: BentoItem[] = [
  {
    featured: true,
    title: "Desenvolvido exclusivamente para você",
    description:
      "Nada de templates genéricos. Cada tela, fluxo e regra de negócio é pensado para a forma como a sua empresa realmente opera.",
    icon: (
      <svg
        aria-hidden="true"
        width="24"
        height="24"
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
    title: "100% White Label",
    description:
      "Sua marca do login ao dashboard. Nenhum resquício da Brusync aparece para o seu cliente ou sua equipe.",
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
        <rect x="3" y="3" width="18" height="18" rx="4" />
        <path d="M8 12h8M12 8v8" />
      </svg>
    ),
  },
  {
    title: "Seu domínio, sua identidade",
    description:
      "O sistema roda no seu domínio, com as suas cores e a sua logo — como se tivesse sido feito por um time interno.",
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
        <rect x="4" y="10" width="16" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </svg>
    ),
  },
  {
    featured: true,
    title: "Conecta com qualquer sistema que você já usa",
    description:
      "Integramos com o que já existe na sua operação: ERP, CRM, planilhas, WhatsApp, ferramentas de anúncio e muito mais — sem trocar nada do que já funciona.",
    icon: (
      <svg
        aria-hidden="true"
        width="24"
        height="24"
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
    title: "Inteligência Artificial embarcada",
    description:
      "Alertas, resumos e previsões nativos no seu sistema — não um chatbot terceirizado colado por cima.",
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
    title: "Escalável do primeiro dia",
    description:
      "Arquitetura preparada para crescer junto com a sua operação, sem trocar de plataforma no meio do caminho.",
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
    title: "Sem mensalidade de ferramenta pronta",
    description:
      "Você investe uma vez na construção do seu ativo — não aluga acesso a um software genérico para sempre.",
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
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    title: "Independência tecnológica total",
    description: "O sistema é seu. Sem depender de decisões, preços ou limitações de terceiros.",
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
];

export function DifferentiatorsSection() {
  return (
    <section className="diff" id="diferenciais">
      <Container>
        <Reveal as="h2" className="sec-title">
          Por que empresas escolhem <span className="accent">construir com a Brusync</span>
        </Reveal>
        <Reveal as="p" className="sec-sub">
          Não é uma plataforma. É o seu sistema, construído do seu jeito.
        </Reveal>
        <div className="diff-grid">
          {DIFFERENTIATORS.map((d, i) => (
            <Reveal
              key={d.title}
              as="div"
              className={`diff-card${d.featured ? " featured" : ""}`}
              delay={((i % 4) + 1) as 1 | 2 | 3 | 4}
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
