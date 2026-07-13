import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import type { TestimonialItem } from "@/types";

const SECTORS = [
  {
    name: "Indústria",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="9" width="18" height="12" rx="1" />
        <path d="M3 9l5-4v4l5-4v4l5-4v4" />
      </svg>
    ),
  },
  {
    name: "Varejo",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 2 3 7v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-3-5" />
        <path d="M3 7h18M9 11a3 3 0 0 0 6 0" />
      </svg>
    ),
  },
  {
    name: "Serviços",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" />
      </svg>
    ),
  },
  {
    name: "Saúde",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.6z" />
      </svg>
    ),
  },
  {
    name: "Logística",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="1" y="7" width="15" height="10" rx="1" />
        <path d="M16 10h4l3 3v4h-7z" />
        <circle cx="6" cy="19" r="1.6" />
        <circle cx="18" cy="19" r="1.6" />
      </svg>
    ),
  },
  {
    name: "Educação",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3 2 8l10 5 10-5-10-5z" />
        <path d="M6 10.5V16c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-5.5" />
      </svg>
    ),
  },
  {
    name: "Tecnologia",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="6" y="6" width="12" height="12" rx="2" />
        <path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2" />
      </svg>
    ),
  },
  {
    name: "Agronegócio",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22V12" />
        <path d="M12 12c0-5-4-8-8-8 0 5 3 9 8 9zM12 12c0-5 4-8 8-8 0 5-3 9-8 9z" />
      </svg>
    ),
  },
];

const TESTIMONIALS: TestimonialItem[] = [
  {
    quote:
      "A Brusync entregou exatamente o sistema que a gente desenhou na cabeça, com a nossa marca do início ao fim.",
    role: "Diretor Comercial",
    segment: "Indústria de médio porte",
  },
  {
    quote:
      "Deixamos de pagar por três ferramentas soltas para ter uma plataforma só nossa, no nosso domínio.",
    role: "Sócia-fundadora",
    segment: "Rede de varejo",
  },
  {
    quote:
      "O que mais pesou na decisão foi saber que o sistema é um ativo nosso, não um acesso alugado.",
    role: "Gerente de Operações",
    segment: "Prestadora de serviços",
  },
];

export function SocialProofSection() {
  return (
    <section className="social-proof" id="prova-social">
      <Container>
        <Reveal as="h2" className="sec-title">
          O padrão que buscamos <span className="accent">em cada projeto</span>
        </Reveal>
        <Reveal as="p" className="sec-sub">
          Ainda estamos construindo nosso portfólio público de cases. Enquanto isso, veja o que
          buscamos entregar em cada projeto.
        </Reveal>

        <Reveal className="logo-marquee" delay={1}>
          <div className="logo-track">
            {(["a", "b"] as const).flatMap((set) =>
              SECTORS.map((s) => (
                <div className="logo-chip" key={`${set}-${s.name}`}>
                  {s.icon}
                  <span>{s.name}</span>
                </div>
              )),
            )}
          </div>
        </Reveal>

        <div className="testi-grid">
          {TESTIMONIALS.map((t, i) => (
            <Reveal
              as="div"
              className="testi-card"
              key={t.role}
              delay={((i % 4) + 1) as 1 | 2 | 3 | 4}
              data-spot=""
            >
              <p className="testi-quote">{t.quote}</p>
              <div className="testi-meta">
                <div className="testi-role">{t.role}</div>
                <div className="testi-segment">{t.segment}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
