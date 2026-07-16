import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageShell } from "@/components/layout/PageShell";
import { MaterialCover } from "@/components/materials/MaterialCover";
import { Container } from "@/components/ui/Container";
import { buildMetadata } from "@/config/seo.config";
import { materials } from "@/data/materials";

export const metadata: Metadata = buildMetadata({
  title: "Materiais",
  description:
    "eBooks, checklists, guias e templates sobre software White Label, Inteligência Artificial, integração de sistemas e indicadores de gestão.",
  path: "/materiais",
});

export default function MateriaisPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Materiais"
        title="Uma biblioteca para ajudar você a decidir melhor."
        description="eBooks, checklists, guias e templates práticos sobre software próprio, Inteligência Artificial e gestão orientada a dados — gratuitos para download."
      />

      <section className="page-section">
        <Container>
          <div className="mat-grid">
            {materials.map((item) => (
              <a className="mat-card" href={`/materiais/${item.slug}`} key={item.slug}>
                <MaterialCover
                  topic={item.topic}
                  title={item.title}
                  format={item.format}
                  className="mat-cover"
                />
                <div className="mat-body">
                  <span className="mat-tag">{item.tag}</span>
                  <p>{item.description}</p>
                  <div className="mat-meta">
                    <span>{item.category}</span>
                    <span className="dot" />
                    <span>{item.pages ? `${item.pages} páginas` : item.readingTime}</span>
                  </div>
                  <span className="mat-download-btn">
                    <svg
                      aria-hidden="true"
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 3v13m0 0-4.5-4.5M12 16l4.5-4.5" />
                      <path d="M4 19h16" />
                    </svg>
                    Baixar gratuitamente
                  </span>
                </div>
              </a>
            ))}
          </div>
        </Container>
      </section>
    </PageShell>
  );
}
