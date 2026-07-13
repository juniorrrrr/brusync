"use client";

import dynamic from "next/dynamic";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import type { DifferentiatorItem } from "@/types";

const DashboardCarousel = dynamic(() =>
  import("@/components/dashboard-mock/DashboardCarousel").then((m) => m.DashboardCarousel),
);

const SOLUTION_MODULES: DifferentiatorItem[] = [
  {
    title: "CRM Personalizado",
    description: "Pare de adaptar sua operação comercial a um CRM genérico.",
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
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
      </svg>
    ),
  },
  {
    title: "Portal do Cliente",
    description: "Seu cliente acompanha tudo em um ambiente com a sua marca.",
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
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 9h18" />
      </svg>
    ),
  },
  {
    title: "Portal Comercial",
    description: "Sua equipe de vendas com uma ferramenta feita para o seu funil.",
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
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" />
      </svg>
    ),
  },
  {
    title: "Portal Financeiro",
    description: "Controle financeiro sem depender de planilha ou sistema engessado.",
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
    title: "Sistema Operacional",
    description: "Automatize e organize os processos do dia a dia da sua operação.",
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
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
      </svg>
    ),
  },
  {
    title: "Aplicativo Mobile",
    description: "Leve o seu sistema para o bolso da sua equipe ou dos seus clientes.",
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
        <rect x="7" y="2" width="10" height="20" rx="2" />
        <path d="M11 18h2" />
      </svg>
    ),
  },
  {
    title: "Dashboard Executivo",
    description: "Decisões rápidas com os indicadores que realmente importam para você.",
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
        <rect x="3" y="3" width="18" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
  },
  {
    title: "Business Intelligence",
    description: "Cruze dados de toda a empresa e enxergue o que ninguém mais vê.",
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
        <path d="M9 11H3v10h6zM15 3H9v18h6zM21 7h-6v14h6z" />
      </svg>
    ),
  },
  {
    title: "Automação de Processos",
    description: "Elimine tarefas manuais e repetitivas da rotina da sua equipe.",
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
    title: "Integrações",
    description: "Conecte qualquer sistema que a sua empresa já utiliza.",
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
    title: "Agentes de IA",
    description: "Inteligência Artificial trabalhando dentro do seu próprio sistema.",
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
    title: "Portal RH",
    description: "Gestão de pessoas em um ambiente feito para a sua cultura.",
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
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

export function SolutionsGridSection() {
  return (
    <section className="ia" id="solucoes">
      <Container>
        <Reveal as="h2" className="sec-title">
          Um sistema. <span className="accent">Todos os módulos</span> que a sua empresa precisa.
        </Reveal>
        <Reveal className="sec-sub" as="p">
          Cada solução resolve um problema real da sua operação — e todas vivem dentro da sua
          própria plataforma.
        </Reveal>
        <div className="ia-grid">
          {SOLUTION_MODULES.map((item, i) => (
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

        <Reveal className="flow-mid" delay={2}>
          Um painel diferente para cada área da sua empresa.
        </Reveal>
        <DashboardCarousel />
      </Container>
    </section>
  );
}
