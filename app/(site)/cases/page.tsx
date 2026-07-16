import type { Metadata } from "next";
import { CaseCover } from "@/components/cases/CaseCover";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { buildMetadata } from "@/config/seo.config";
import { cases } from "@/data/cases";

export const metadata: Metadata = buildMetadata({
  title: "Cases",
  description:
    "Plataformas white label desenvolvidas pela Brusync: dashboards executivos, CRM comercial, ERP e central de atendimento omnichannel, construídos sob medida.",
  path: "/cases",
});

export default function CasesPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Cases"
        title="Software sob medida, para operações reais."
        description="Plataformas completas desenvolvidas do zero pela Brusync — sistemas próprios, com a marca do cliente, construídos para resolver problemas específicos de cada operação."
      />

      <section className="page-section">
        <Container>
          <div className="case-index-grid">
            {cases.map((item) => (
              <a className="case-index-card" href={`/cases/${item.slug}`} key={item.slug}>
                <CaseCover category={item.category} className="case-cover" />
                <div className="case-index-body">
                  <span className="case-index-cat">{item.category}</span>
                  <h3>{item.name}</h3>
                  <p>{item.summary}</p>
                  <div className="case-index-stats">
                    {item.stats.slice(0, 2).map((stat) => (
                      <div key={stat.label}>
                        <b>{stat.value}</b>
                        <span>{stat.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="case-index-tags">
                    {item.techStack.slice(0, 4).map((tech) => (
                      <span className="case-index-tag" key={tech}>
                        {tech}
                      </span>
                    ))}
                  </div>
                  <span className="case-index-link">
                    Ver case completo
                    <svg
                      aria-hidden="true"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </span>
                </div>
              </a>
            ))}
          </div>
        </Container>
      </section>

      <section className="page-section">
        <Container>
          <div className="article-cta">
            <h3>Quer um sistema assim para a sua empresa?</h3>
            <p>Conte para a gente o que sua operação precisa e vamos desenhar juntos.</p>
            <Button href="/#contato" withArrow>
              Quero meu software
            </Button>
          </div>
        </Container>
      </section>
    </PageShell>
  );
}
