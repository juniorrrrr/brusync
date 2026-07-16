import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { buildMetadata } from "@/config/seo.config";
import { cases } from "@/data/cases";

export const metadata: Metadata = buildMetadata({
  title: "Cases",
  description:
    "Exemplos de plataformas white label que a Brusync desenvolve: dashboards executivos, CRMs personalizados e sistemas de gestão sob medida.",
  path: "/cases",
});

export default function CasesPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Cases"
        title="Software sob medida, para operações reais."
        description="Confira exemplos do tipo de plataforma que desenvolvemos: sistemas próprios, com a marca do cliente, construídos para resolver problemas específicos de cada operação."
      />

      <section className="page-section">
        <Container>
          <div className="demo-banner">
            <svg
              aria-hidden="true"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 9v4M12 17h.01" />
              <circle cx="12" cy="12" r="9" />
            </svg>
            Os projetos abaixo são demonstrativos e ilustram o tipo de solução que desenvolvemos. Em
            breve, esta página será atualizada com cases reais de clientes.
          </div>

          <div className="case-grid">
            {cases.map((item) => (
              <article className="case-card" key={item.slug}>
                <span className="case-badge">Demonstrativo · {item.segment}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <div className="case-tags">
                  {item.tags.map((tag) => (
                    <span className="case-tag" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="page-section">
        <Container>
          <div className="article-cta">
            <h3>Quer um case assim para a sua empresa?</h3>
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
