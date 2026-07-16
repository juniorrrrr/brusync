import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { buildMetadata } from "@/config/seo.config";
import { siteConfig } from "@/config/site.config";
import { jsonLdScript } from "@/lib/jsonLd";

export const metadata: Metadata = buildMetadata({
  title: "Sobre a Brusync",
  description:
    "Conheça a Brusync: por que criamos a empresa, nossa missão, nossa filosofia e por que acreditamos que cada negócio merece um sistema próprio — não mais uma assinatura.",
  path: "/sobre",
});

const OWNERSHIP = [
  {
    title: "Sistema próprio",
    icon: (
      <svg
        aria-hidden="true"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="4" width="18" height="14" rx="2" />
        <path d="M8 21h8M12 18v3" />
      </svg>
    ),
  },
  {
    title: "Domínio próprio",
    icon: (
      <svg
        aria-hidden="true"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z" />
      </svg>
    ),
  },
  {
    title: "Identidade visual própria",
    icon: (
      <svg
        aria-hidden="true"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="13.5" cy="6.5" r="2" />
        <circle cx="19" cy="17" r="2" />
        <circle cx="7" cy="17" r="2" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
  },
  {
    title: "Banco de dados próprio",
    icon: (
      <svg
        aria-hidden="true"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <ellipse cx="12" cy="5" rx="8" ry="3" />
        <path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
      </svg>
    ),
  },
  {
    title: "Tecnologia própria",
    icon: (
      <svg
        aria-hidden="true"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
      </svg>
    ),
  },
];

export default function SobrePage() {
  return (
    <PageShell>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD, no user input
        dangerouslySetInnerHTML={jsonLdScript({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: siteConfig.name,
          url: siteConfig.url,
          description: siteConfig.description,
          email: siteConfig.contact.email,
          address: {
            "@type": "PostalAddress",
            addressLocality: siteConfig.contact.location,
          },
        })}
      />

      <PageHeader
        eyebrow="Sobre a Brusync"
        title="Sistema próprio. Marca própria. Um ativo digital seu."
        description="Somos uma empresa de tecnologia que desenvolve plataformas exclusivas e white label para negócios que não querem mais alugar espaço dentro do software de outra empresa."
      />

      <section className="page-section">
        <Container>
          <div className="about-grid">
            <div className="about-card">
              <h3>Quem somos</h3>
              <p>
                A Brusync nasceu para resolver um problema que quase toda empresa em crescimento
                enfrenta: depender de softwares genéricos que resolvem no início, mas travam a
                operação depois. Somos uma equipe de engenharia dedicada a construir sistemas sob
                medida — CRM, dashboards, automações e agentes de Inteligência Artificial — como
                plataformas próprias, não como assinaturas.
              </p>
            </div>
            <div className="about-card">
              <h3>Nossa missão</h3>
              <p>
                Dar a cada empresa o controle total sobre o próprio software: sua marca, seu
                domínio, seus dados e suas regras de negócio, sem depender do roadmap ou dos limites
                de uma plataforma de terceiros.
              </p>
            </div>
            <div className="about-card">
              <h3>Nossa visão</h3>
              <p>
                Ser a referência em desenvolvimento de software próprio white label no Brasil,
                tornando comum o que hoje é exceção: empresas que possuem — e não alugam — a
                tecnologia que move o seu negócio.
              </p>
            </div>
            <div className="about-card">
              <h3>Nossos diferenciais</h3>
              <p>
                Cada plataforma é desenvolvida exclusivamente para o cliente que a contrata: sem
                templates genéricos, sem mensalidade por usuário e sem letras miúdas limitando o que
                o sistema pode fazer. O que construímos é seu, do primeiro dia em diante.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section className="page-section">
        <Container>
          <div className="page-section-head">
            <h2>Por que criamos a Brusync</h2>
            <p>
              Vimos empresas pagando cada vez mais caro por ferramentas prontas que nunca chegam a
              ser realmente delas — sem personalização de verdade, sem domínio próprio e sem
              propriedade sobre os dados gerados todos os dias. Decidimos construir o caminho
              contrário: sistemas desenvolvidos sob medida, entregues como propriedade do cliente,
              não como acesso temporário a uma plataforma alheia.
            </p>
          </div>

          <div className="page-section-head">
            <h2>Nossa filosofia</h2>
            <p>
              Acreditamos que tecnologia deveria fortalecer a marca de quem a usa — não a substituir
              pela marca de quem a vende. Por isso, tudo o que desenvolvemos é white label por
              padrão: o cliente possui o sistema, o domínio, a identidade visual, o banco de dados e
              a tecnologia por trás da própria operação.
            </p>
          </div>

          <div className="ownership-grid">
            {OWNERSHIP.map((item) => (
              <div className="ownership-item" key={item.title}>
                <div className="ico">{item.icon}</div>
                <span>{item.title}</span>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="page-section">
        <Container>
          <div className="article-cta">
            <h3>Quer um sistema que seja realmente seu?</h3>
            <p>Fale com a gente e veja como fica um software desenhado para a sua operação.</p>
            <Button href="/#contato" withArrow>
              Quero meu software
            </Button>
          </div>
        </Container>
      </section>
    </PageShell>
  );
}
