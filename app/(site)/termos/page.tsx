import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageShell } from "@/components/layout/PageShell";
import { Container } from "@/components/ui/Container";
import { buildMetadata } from "@/config/seo.config";
import { siteConfig } from "@/config/site.config";

export const metadata: Metadata = buildMetadata({
  title: "Termos de Uso",
  description:
    "Condições de uso do site da Brusync: responsabilidades, limitações, direitos autorais e conformidade com a LGPD.",
  path: "/termos",
});

export default function TermosPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Termos"
        title="Termos de Uso"
        description="Ao acessar e utilizar o site brusync.com.br, você concorda com os termos e condições descritos a seguir. Leia com atenção antes de continuar navegando."
      />

      <section className="page-section">
        <Container>
          <div className="legal-content">
            <p className="updated-at">Última atualização: 15 de julho de 2026</p>

            <section>
              <h2>1. Uso do site</h2>
              <p>
                Este site tem finalidade institucional e comercial: apresentar as soluções da{" "}
                {siteConfig.name}, permitir contato com nossa equipe e disponibilizar conteúdo
                informativo (blog, cases e materiais). O uso do site deve respeitar a legislação
                brasileira e estes Termos de Uso.
              </p>
              <p>
                É vedado utilizar o site para fins ilícitos, tentar acessar áreas restritas sem
                autorização, ou realizar qualquer ação que comprometa sua segurança ou
                disponibilidade.
              </p>
            </section>

            <section>
              <h2>2. Cases e materiais demonstrativos</h2>
              <p>
                Os projetos apresentados na página de Cases têm caráter{" "}
                <strong>demonstrativo</strong>, ilustrando o tipo de solução que desenvolvemos, e
                não representam necessariamente clientes reais. Materiais disponibilizados na página
                de Materiais têm caráter informativo e institucional.
              </p>
            </section>

            <section>
              <h2>3. Propriedade intelectual e direitos autorais</h2>
              <p>
                Todo o conteúdo deste site — textos, layout, identidade visual, código-fonte e
                materiais gráficos — é de propriedade da {siteConfig.name} ou de seus licenciantes,
                protegido pela legislação de direitos autorais e propriedade industrial. É proibida
                a reprodução, distribuição ou uso comercial de qualquer conteúdo sem autorização
                prévia por escrito.
              </p>
            </section>

            <section>
              <h2>4. Limitações de responsabilidade</h2>
              <p>
                Envidamos esforços para manter as informações deste site precisas e atualizadas, mas
                não garantimos que o conteúdo esteja livre de erros ou que o site funcione de forma
                ininterrupta. A {siteConfig.name} não se responsabiliza por danos decorrentes do uso
                indevido do site ou de instabilidades fora do nosso controle.
              </p>
              <p>
                Links para sites de terceiros podem ser apresentados por conveniência; não nos
                responsabilizamos pelo conteúdo ou práticas de privacidade de sites externos.
              </p>
            </section>

            <section>
              <h2>5. Proteção de dados (LGPD)</h2>
              <p>
                O tratamento de dados pessoais coletados através deste site segue o disposto em
                nossa <a href="/privacidade">Política de Privacidade</a>, elaborada em conformidade
                com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
              </p>
            </section>

            <section>
              <h2>6. Alterações destes termos</h2>
              <p>
                Estes Termos de Uso podem ser atualizados a qualquer momento, para refletir mudanças
                no site, nos serviços oferecidos ou na legislação aplicável. O uso continuado do
                site após alterações implica concordância com os novos termos.
              </p>
            </section>

            <section>
              <h2>7. Legislação aplicável e contato</h2>
              <p>
                Estes termos são regidos pela legislação brasileira. Em caso de dúvidas sobre estes
                Termos de Uso, entre em contato pelo e-mail{" "}
                <strong>{siteConfig.contact.email}</strong>.
              </p>
            </section>
          </div>
        </Container>
      </section>
    </PageShell>
  );
}
