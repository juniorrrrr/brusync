import type { ReactNode } from "react";
import {
  SceneAi,
  SceneBlueprint,
  SceneDomain,
  SceneIndependence,
  SceneIntegrations,
  SceneOnce,
  SceneScale,
  SceneWhiteLabel,
} from "@/components/sections/BentoScenes";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";

type BentoSize = "lg" | "sm" | "md";

interface BentoItem {
  size: BentoSize;
  title: string;
  description: string;
  scene: ReactNode;
}

const DIFFERENTIATORS: BentoItem[] = [
  {
    size: "lg",
    title: "Desenvolvido exclusivamente para você",
    description:
      "Nada de templates genéricos. Cada tela, fluxo e regra de negócio é pensado para a forma como a sua empresa realmente opera.",
    scene: <SceneBlueprint />,
  },
  {
    size: "sm",
    title: "100% White Label",
    description: "Sua marca do login ao dashboard, sem nenhum resquício da Brusync.",
    scene: <SceneWhiteLabel />,
  },
  {
    size: "sm",
    title: "Seu domínio, sua identidade",
    description: "O sistema roda no seu domínio, como se fosse feito por um time interno.",
    scene: <SceneDomain />,
  },
  {
    size: "lg",
    title: "Conecta com qualquer sistema que você já usa",
    description:
      "Integramos com o que já existe na sua operação: ERP, CRM, planilhas, WhatsApp, ferramentas de anúncio e muito mais, sem trocar nada do que já funciona.",
    scene: <SceneIntegrations />,
  },
  {
    size: "sm",
    title: "Inteligência Artificial embarcada",
    description: "Alertas, resumos e previsões nativos, não um chatbot colado por cima.",
    scene: <SceneAi />,
  },
  {
    size: "sm",
    title: "Escalável do primeiro dia",
    description: "Arquitetura pronta para crescer junto com a operação.",
    scene: <SceneScale />,
  },
  {
    size: "md",
    title: "Sem mensalidade de ferramenta pronta",
    description: "Você investe uma vez na construção do seu ativo, não aluga acesso para sempre.",
    scene: <SceneOnce />,
  },
  {
    size: "md",
    title: "Independência tecnológica total",
    description: "O sistema é seu, sem depender de decisões ou preços de terceiros.",
    scene: <SceneIndependence />,
  },
];

export function DifferentiatorsSection() {
  return (
    <section className="diff" id="diferenciais">
      <Container>
        <Reveal as="h2" className="sec-title">
          Por que empresas escolhem <span className="accent">construir com a Brusync</span>
        </Reveal>
        <Reveal as="p" className="sec-sub">
          Não é uma plataforma. É o seu sistema, construído do seu jeito.
        </Reveal>
        <div className="bento">
          {DIFFERENTIATORS.map((d, i) => (
            <Reveal
              key={d.title}
              as="div"
              className={`bento-card bento-${d.size}`}
              delay={((i % 4) + 1) as 1 | 2 | 3 | 4}
              data-spot=""
            >
              {d.scene}
              <h3>{d.title}</h3>
              <p>{d.description}</p>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
