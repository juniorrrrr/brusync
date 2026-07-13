import { SolutionDashboardMock } from "@/components/dashboard-mock/SolutionDashboardMock";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import type { SolutionItem } from "@/types";

const SOLUTIONS: SolutionItem[] = [
  {
    title: "Marketing",
    description: "Acompanhe campanhas, resultados e ROI em tempo real.",
    icon: (
      <svg
        aria-hidden="true"
        width="19"
        height="19"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M3 3v18h18" />
        <path d="m7 14 4-4 3 3 5-6" />
      </svg>
    ),
  },
  {
    title: "Vendas",
    description: "Visualize funil, oportunidades e previsões de fechamento.",
    icon: (
      <svg
        aria-hidden="true"
        width="19"
        height="19"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="9" cy="21" r="1.4" />
        <circle cx="19" cy="21" r="1.4" />
        <path d="M2 3h3l3 13h11l2-9H6" />
      </svg>
    ),
  },
  {
    title: "Financeiro",
    description: "Receitas, custos e lucratividade sempre atualizados.",
    icon: (
      <svg
        aria-hidden="true"
        width="19"
        height="19"
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
    title: "Operação",
    description: "Indicadores operacionais para mais eficiência e controle.",
    icon: (
      <svg
        aria-hidden="true"
        width="19"
        height="19"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="3" />
        <circle cx="12" cy="12" r="8" />
      </svg>
    ),
  },
  {
    title: "Comercial",
    description: "Performance de equipes, metas e resultados consolidados.",
    icon: (
      <svg
        aria-hidden="true"
        width="19"
        height="19"
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

export function SolutionSection() {
  return (
    <section className="solution" id="solucao">
      <div className="ambient" aria-hidden="true">
        <div
          className="orb orb-teal d1"
          style={{ width: 360, height: 360, top: -100, right: -90 }}
        />
        <div
          className="orb orb-blue d2"
          style={{ width: 320, height: 320, bottom: -90, left: -80 }}
        />
        <div className="grid-lines" style={{ opacity: 0.5 }} />
      </div>
      <Container className="sol-grid">
        <Reveal>
          <SolutionDashboardMock />
        </Reveal>

        <Reveal delay={1}>
          <h2>
            Tudo <span className="accent">integrado.</span>
            <br />
            Tudo <span className="accent">inteligente.</span>
          </h2>
          <div className="sol-list">
            {SOLUTIONS.map((s) => (
              <div key={s.title} className="sol-item">
                <div className="sol-ico">{s.icon}</div>
                <div>
                  <h4>{s.title}</h4>
                  <p>{s.description}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="sol-final">
            Tudo em <i>uma única fonte de verdade.</i>
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
