import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { siteConfig } from "@/config/site.config";
import { socialLinks } from "@/config/social.config";

const SOCIAL_ICONS: Record<string, ReactNode> = {
  LinkedIn: (
    <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.5 9.5H9V18H6.5zM7.7 5.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM11 9.5h2.4v1.2c.4-.7 1.3-1.4 2.7-1.4 2 0 3 1.3 3 3.6V18h-2.5v-4.6c0-1.2-.5-1.9-1.5-1.9s-1.6.7-1.6 1.9V18H11z" />
    </svg>
  ),
  Instagram: (
    <svg
      aria-hidden="true"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  "E-mail": (
    <svg
      aria-hidden="true"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m2 7 10 6 10-6" />
    </svg>
  ),
};

const FOOTER_COLUMNS = [
  {
    title: "Soluções",
    links: [
      "Inteligência de Dados",
      "Integração de Sistemas",
      "Automação de Processos",
      "Inteligência Artificial",
    ],
  },
  {
    title: "Recursos",
    links: ["Cases", "Blog", "Materiais Ricos", "API"],
  },
  {
    title: "Empresa",
    links: ["Sobre a Brusync", "Trabalhe Conosco", "Política de Privacidade", "Termos de Uso"],
  },
];

export function Footer() {
  return (
    <footer className="footer" id="cases">
      <div className="hairline" aria-hidden="true" />
      <Container>
        <div className="foot-grid">
          <div className="foot-brand">
            <span className="logo-word">
              {siteConfig.name}
              <i>.</i>
            </span>
            <div className="foot-tag">
              Conectando dados.
              <br />
              Orientando decisões.
            </div>
            <p className="foot-desc">
              Transformamos dados em inteligência para impulsionar o crescimento da sua empresa.
            </p>
            <div className="foot-social">
              {socialLinks.map((s) => (
                <a key={s.label} href={s.href} aria-label={s.label}>
                  {SOCIAL_ICONS[s.label]}
                </a>
              ))}
            </div>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <div className="foot-col" key={col.title}>
              <h5>{col.title}</h5>
              {col.links.map((link) => (
                // biome-ignore lint/a11y/useValidAnchor: placeholder — page not built yet
                <a href="#" key={link}>
                  {link}
                </a>
              ))}
            </div>
          ))}

          <div className="foot-col">
            <h5>Fale com a gente</h5>
            <div className="foot-contact">
              <svg
                aria-hidden="true"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5c-1.5 0-3-.4-4.2-1.1L3 20l1.1-5.3A8.4 8.4 0 0 1 3 11.5 8.4 8.4 0 0 1 11.5 3a8.4 8.4 0 0 1 9.5 8.5z" />
              </svg>
              {siteConfig.contact.phone}
            </div>
            <div className="foot-contact">
              <svg
                aria-hidden="true"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m2 7 10 6 10-6" />
              </svg>
              {siteConfig.contact.email}
            </div>
            <div className="foot-contact">
              <svg
                aria-hidden="true"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {siteConfig.contact.location}
            </div>
          </div>
        </div>
        <div className="foot-bottom">© 2026 {siteConfig.name}. Todos os direitos reservados.</div>
      </Container>
    </footer>
  );
}
