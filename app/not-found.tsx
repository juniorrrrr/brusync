import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export default function NotFound() {
  return (
    <PageShell>
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
        <Container className="page-hero-inner">
          <div className="reveal in">
            <span className="page-hero-eyebrow">Erro 404</span>
            <h1>Essa página não existe.</h1>
            <p className="page-hero-desc">
              O endereço pode ter mudado ou o conteúdo não está mais disponível. Volte para o início
              ou confira nossos cases e materiais.
            </p>
            <div className="page-hero-cta multi">
              <Button href="/" withArrow>
                Voltar para o início
              </Button>
              <Button href="/cases" variant="outline">
                Ver cases
              </Button>
            </div>
          </div>
        </Container>
      </header>
    </PageShell>
  );
}
