import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { buildMetadata } from "@/config/seo.config";
import { materials } from "@/data/materials";

export const metadata: Metadata = buildMetadata({
  title: "Materiais",
  description:
    "Checklists e guias sobre digitalização empresarial, integração de sistemas e software White Label. Conteúdo em preparação pela Brusync.",
  path: "/materiais",
});

export default function MateriaisPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Materiais"
        title="Conteúdo para ajudar você a decidir melhor."
        description="Estamos preparando checklists e guias práticos sobre digitalização, integração de sistemas e software próprio. Confira o que está a caminho."
      />

      <section className="page-section">
        <Container>
          <div className="material-grid">
            {materials.map((item) => (
              <article className="material-card" key={item.slug}>
                <div className="material-ico">
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
                    <path d="M14 2v6h6M9 13h6M9 17h6" />
                  </svg>
                </div>
                <span className="case-badge">{item.format}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <span className="material-status">
                  <svg
                    aria-hidden="true"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="4" y="10" width="16" height="10" rx="2" />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  </svg>
                  Em breve
                </span>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="page-section">
        <Container>
          <div className="article-cta">
            <h3>Quer ser avisado quando os materiais forem publicados?</h3>
            <p>Fale com a gente e entre para a lista de novidades da Brusync.</p>
            <Button href="/#contato" withArrow>
              Quero saber mais
            </Button>
          </div>
        </Container>
      </section>
    </PageShell>
  );
}
