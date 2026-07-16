import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageShell } from "@/components/layout/PageShell";
import { Container } from "@/components/ui/Container";
import { buildMetadata } from "@/config/seo.config";
import { siteConfig } from "@/config/site.config";

export const metadata: Metadata = buildMetadata({
  title: "Política de Privacidade",
  description:
    "Como a Brusync coleta, usa e protege dados pessoais, em conformidade com a LGPD (Lei Geral de Proteção de Dados).",
  path: "/privacidade",
});

export default function PrivacidadePage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Privacidade"
        title="Política de Privacidade"
        description="Esta política explica, de forma clara, como a Brusync coleta, utiliza e protege dados pessoais no site brusync.com.br, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD)."
      />

      <section className="page-section">
        <Container>
          <div className="legal-content">
            <p className="updated-at">Última atualização: 15 de julho de 2026</p>

            <section>
              <h2>1. Quem é o controlador dos dados</h2>
              <p>
                A <strong>{siteConfig.name}</strong> é a controladora dos dados pessoais coletados
                através deste site. Em caso de dúvidas sobre esta política ou sobre o tratamento dos
                seus dados, entre em contato pelo e-mail <strong>{siteConfig.contact.email}</strong>
                .
              </p>
            </section>

            <section>
              <h2>2. Dados coletados por formulários</h2>
              <p>
                Ao preencher o formulário de contato do site, coletamos as informações fornecidas
                voluntariamente por você: nome, e-mail, empresa, telefone (opcional) e a mensagem
                enviada. Esses dados são usados exclusivamente para responder à sua solicitação e
                apresentar nossas soluções.
              </p>
            </section>

            <section>
              <h2>3. Cookies e tecnologias de rastreamento</h2>
              <p>
                Este site utiliza cookies e tecnologias semelhantes para melhorar a experiência de
                navegação, entender como os visitantes utilizam o site e mensurar a performance de
                campanhas de marketing. Você pode gerenciar ou desativar cookies diretamente nas
                configurações do seu navegador, o que pode limitar algumas funcionalidades do site.
              </p>
            </section>

            <section>
              <h2>4. Ferramentas de análise e publicidade</h2>
              <p>Utilizamos as seguintes ferramentas de terceiros para análise e publicidade:</p>
              <ul>
                <li>
                  <strong>Google Analytics / Google Tag Manager (GA4):</strong> coleta dados
                  estatísticos e de comportamento de navegação, de forma agregada, para entender o
                  uso do site.
                </li>
                <li>
                  <strong>Microsoft Clarity:</strong> pode ser utilizado para gerar mapas de calor e
                  gravações anônimas de sessão, ajudando a identificar melhorias de usabilidade.
                </li>
                <li>
                  <strong>Google Ads:</strong> utilizado para mensurar a performance de campanhas
                  publicitárias e exibir anúncios relevantes em outros sites.
                </li>
                <li>
                  <strong>Meta Pixel (Facebook/Instagram):</strong> utilizado para mensurar
                  conversões e otimizar campanhas publicitárias veiculadas nas plataformas da Meta.
                </li>
              </ul>
              <p>
                Essas ferramentas podem coletar dados como endereço IP, tipo de dispositivo, páginas
                visitadas e tempo de navegação. Nenhuma dessas ferramentas é usada para identificar
                você pessoalmente fora do contexto de análise e publicidade descrito aqui.
              </p>
            </section>

            <section>
              <h2>5. Finalidade do tratamento de dados</h2>
              <p>Os dados coletados são utilizados para:</p>
              <ul>
                <li>Responder solicitações de contato e orçamento;</li>
                <li>Melhorar a experiência de navegação e o conteúdo do site;</li>
                <li>Mensurar a performance de campanhas de marketing e publicidade;</li>
                <li>Cumprir obrigações legais ou regulatórias, quando aplicável.</li>
              </ul>
            </section>

            <section>
              <h2>6. Compartilhamento de dados</h2>
              <p>
                Não vendemos dados pessoais a terceiros. Dados podem ser compartilhados com
                provedores de infraestrutura e ferramentas de análise/publicidade mencionados nesta
                política, estritamente para viabilizar os serviços descritos, e sempre sob acordos
                que respeitam a LGPD.
              </p>
            </section>

            <section>
              <h2>7. Seus direitos como titular dos dados</h2>
              <p>De acordo com a LGPD, você tem direito a:</p>
              <ul>
                <li>Confirmar a existência de tratamento dos seus dados;</li>
                <li>Acessar, corrigir ou atualizar seus dados;</li>
                <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários;</li>
                <li>Solicitar a portabilidade dos dados a outro fornecedor;</li>
                <li>Revogar o consentimento e solicitar a exclusão dos dados tratados;</li>
                <li>
                  Obter informações sobre entidades com as quais os dados foram compartilhados.
                </li>
              </ul>
              <p>
                Para exercer qualquer um desses direitos, entre em contato pelo e-mail{" "}
                <strong>{siteConfig.contact.email}</strong>.
              </p>
            </section>

            <section>
              <h2>8. Segurança dos dados</h2>
              <p>
                Adotamos medidas técnicas e organizacionais razoáveis para proteger os dados
                pessoais contra acesso não autorizado, perda, alteração ou destruição.
              </p>
            </section>

            <section>
              <h2>9. Alterações desta política</h2>
              <p>
                Esta política pode ser atualizada periodicamente para refletir mudanças em nossas
                práticas ou na legislação vigente. Recomendamos revisá-la com regularidade.
              </p>
            </section>
          </div>
        </Container>
      </section>
    </PageShell>
  );
}
