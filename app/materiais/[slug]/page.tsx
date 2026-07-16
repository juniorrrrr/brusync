import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { MaterialCover } from "@/components/materials/MaterialCover";
import { Container } from "@/components/ui/Container";
import { buildMetadata } from "@/config/seo.config";
import { siteConfig } from "@/config/site.config";
import { getMaterial, materials } from "@/data/materials";
import { jsonLdScript } from "@/lib/jsonLd";
import { formatDate } from "@/lib/utils";

interface MaterialPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return materials.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: MaterialPageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = getMaterial(slug);
  if (!item) return {};

  return buildMetadata({
    title: item.title,
    description: item.description,
    path: `/materiais/${item.slug}`,
  });
}

export default async function MaterialDetailPage({ params }: MaterialPageProps) {
  const { slug } = await params;
  const item = getMaterial(slug);

  if (!item) {
    notFound();
  }

  const others = materials.filter((m) => m.slug !== item.slug).slice(0, 3);

  return (
    <PageShell>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD, no user input
        dangerouslySetInnerHTML={jsonLdScript({
          "@context": "https://schema.org",
          "@type": "DigitalDocument",
          name: item.title,
          description: item.description,
          encodingFormat: item.format,
          datePublished: item.date,
          publisher: { "@type": "Organization", name: siteConfig.name },
          url: `${siteConfig.url}/materiais/${item.slug}`,
        })}
      />

      <header className="page-hero">
        <div className="ambient" aria-hidden="true">
          <div
            className="orb orb-blue d1"
            style={{ width: 340, height: 340, top: -110, left: -100 }}
          />
          <div
            className="orb orb-teal d2"
            style={{ width: 300, height: 300, top: 10, right: -120 }}
          />
        </div>
        <Container>
          <a className="article-back" href="/materiais">
            ← Voltar para materiais
          </a>
        </Container>
      </header>

      <section className="mat-detail-section">
        <Container>
          <div className="mat-detail">
            <MaterialCover
              topic={item.topic}
              title={item.title}
              format={item.format}
              className="mat-cover mat-detail-cover"
            />
            <div className="mat-detail-body">
              <span className="mat-tag">{item.tag}</span>
              <h1>{item.title}</h1>
              <p className="page-hero-desc">{item.description}</p>

              <div className="mat-detail-meta-grid">
                <div className="mat-detail-meta-item">
                  <span>Categoria</span>
                  <b>{item.category}</b>
                </div>
                <div className="mat-detail-meta-item">
                  <span>Formato</span>
                  <b>{item.format}</b>
                </div>
                <div className="mat-detail-meta-item">
                  <span>{item.pages ? "Páginas" : "Tempo de leitura"}</span>
                  <b>{item.pages ? `${item.pages} páginas` : item.readingTime}</b>
                </div>
                <div className="mat-detail-meta-item">
                  <span>Publicado em</span>
                  <b>{formatDate(item.date)}</b>
                </div>
              </div>

              <h3>O que você vai encontrar</h3>
              <ul className="mat-includes">
                {item.includes.map((inc) => (
                  <li key={inc}>
                    <svg
                      aria-hidden="true"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    {inc}
                  </li>
                ))}
              </ul>

              <a
                className="mat-download-btn mat-detail-download"
                href={`/materiais/${item.fileName}`}
                download
              >
                <svg
                  aria-hidden="true"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 3v13m0 0-4.5-4.5M12 16l4.5-4.5" />
                  <path d="M4 19h16" />
                </svg>
                Baixar {item.format} · {item.fileSizeLabel}
              </a>
            </div>
          </div>
        </Container>
      </section>

      <section className="page-section">
        <Container>
          <div className="page-section-head">
            <h2>Outros materiais</h2>
          </div>
          <div className="mat-grid">
            {others.map((other) => (
              <a className="mat-card" href={`/materiais/${other.slug}`} key={other.slug}>
                <MaterialCover
                  topic={other.topic}
                  title={other.title}
                  format={other.format}
                  className="mat-cover"
                />
                <div className="mat-body">
                  <span className="mat-tag">{other.tag}</span>
                  <p>{other.description}</p>
                  <div className="mat-meta">
                    <span>{other.category}</span>
                    <span className="dot" />
                    <span>{other.pages ? `${other.pages} páginas` : other.readingTime}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </Container>
      </section>
    </PageShell>
  );
}
