import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseCover } from "@/components/cases/CaseCover";
import { DeviceFrame, deviceLabel } from "@/components/dashboard-mock/primitives/DeviceFrame";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { buildMetadata } from "@/config/seo.config";
import { siteConfig } from "@/config/site.config";
import { cases, getCase } from "@/data/cases";
import { jsonLdScript } from "@/lib/jsonLd";

interface CasePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return cases.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: CasePageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = getCase(slug);
  if (!item) return {};

  return buildMetadata({
    title: item.name,
    description: item.summary,
    path: `/cases/${item.slug}`,
  });
}

export default async function CaseDetailPage({ params }: CasePageProps) {
  const { slug } = await params;
  const item = getCase(slug);

  if (!item) {
    notFound();
  }

  const otherCases = cases.filter((c) => c.slug !== item.slug).slice(0, 3);

  return (
    <PageShell>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD, no user input
        dangerouslySetInnerHTML={jsonLdScript({
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          name: item.name,
          description: item.summary,
          creator: { "@type": "Organization", name: siteConfig.name },
          about: item.category,
          url: `${siteConfig.url}/cases/${item.slug}`,
        })}
      />

      <header className="page-hero">
        <div className="ambient" aria-hidden="true">
          <div
            className="orb orb-blue d1"
            style={{ width: 360, height: 360, top: -120, left: -100 }}
          />
          <div
            className="orb orb-teal d2"
            style={{ width: 320, height: 320, top: 20, right: -130 }}
          />
          <div className="grid-lines" style={{ opacity: 0.5 }} />
        </div>
        <Container className="page-hero-inner wide">
          <div className="reveal in">
            <span className="case-hero-tag">{item.category}</span>
            <h1>{item.name}</h1>
            <p className="page-hero-desc">{item.description}</p>
            <div className="page-hero-cta">
              <Button href="/#contato" withArrow>
                Quero um sistema assim
              </Button>
            </div>
            <div className="case-stats">
              {item.stats.map((stat) => (
                <div className="case-stat" key={stat.label}>
                  <b>{stat.value}</b>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </header>

      <section className="page-section">
        <Container>
          <div className="page-section-head">
            <h2>Tecnologias utilizadas</h2>
          </div>
          <div className="tech-stack">
            {item.techStack.map((tech) => (
              <span className="tech-badge" key={tech}>
                {tech}
              </span>
            ))}
          </div>
        </Container>
      </section>

      <section className="page-section">
        <Container>
          <div className="page-section-head">
            <h2>Principais funcionalidades</h2>
          </div>
          <div className="feature-grid">
            {item.features.map((feature) => (
              <div className="feature-item" key={feature}>
                <svg
                  aria-hidden="true"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="page-section">
        <Container>
          <div className="page-section-head">
            <h2>Galeria de telas</h2>
            <p>
              Cada tela foi desenvolvida do zero pela equipe da Brusync — sem templates prontos, sem
              imagens de banco. Uma interface própria, pensada para essa operação.
            </p>
          </div>
          <div className="gallery-grid">
            {item.screens.map((screen, i) => (
              <div className="gallery-item" key={screen.title}>
                <div className="gallery-caption">
                  <span className="gallery-caption-num">
                    {String(i + 1).padStart(2, "0")} /{" "}
                    {String(item.screens.length).padStart(2, "0")}
                  </span>
                  <h3>{screen.title}</h3>
                  <p>{screen.description}</p>
                  <span className="gallery-device-tag">
                    <svg
                      aria-hidden="true"
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="4" y="10" width="16" height="10" rx="2" />
                      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                    </svg>
                    {deviceLabel(screen.device)}
                  </span>
                </div>
                <div className="gallery-figure">
                  <DeviceFrame variant={screen.device}>
                    <screen.Component />
                  </DeviceFrame>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="page-section">
        <Container>
          <div className="article-cta">
            <h3>Quer uma plataforma como essa para o seu negócio?</h3>
            <p>Conte para a gente o que sua operação precisa e vamos desenhar juntos.</p>
            <Button href="/#contato" withArrow>
              Quero meu software
            </Button>
          </div>
        </Container>
      </section>

      <section className="page-section">
        <Container>
          <div className="page-section-head">
            <h2>Outros cases</h2>
          </div>
          <div className="other-cases">
            {otherCases.map((other) => (
              <a className="case-index-card" href={`/cases/${other.slug}`} key={other.slug}>
                <CaseCover category={other.category} className="case-cover" />
                <div className="case-index-body">
                  <span className="case-index-cat">{other.category}</span>
                  <h3>{other.name}</h3>
                  <p>{other.summary}</p>
                </div>
              </a>
            ))}
          </div>
        </Container>
      </section>
    </PageShell>
  );
}
