import { Geist, Inter } from "next/font/google";
import { BrandedAppMockup } from "@/components/dashboard-mock/BrandedAppMockup";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { DiaTextReveal } from "@/components/ui/dia-text-reveal";

const HEADLINE_VARIANTS = ["na sua operação.", "no seu processo.", "no seu negócio."];

const geist = Geist({
  subsets: ["latin"],
  weight: ["900"],
  variable: "--font-geist-hero",
  display: "swap",
});

const interItalic = Inter({
  subsets: ["latin"],
  weight: ["300"],
  style: ["italic"],
  variable: "--font-inter-hero",
  display: "swap",
});

export function Hero() {
  return (
    <AuroraBackground className={`hero h-auto ${geist.variable} ${interItalic.variable}`}>
      <Container className="hero-inner">
        <h1 className="reveal in">
          <span className="hero-title-strong">O sistema certo é aquele que funciona</span>
          <br />
          <DiaTextReveal
            as="span"
            className="hero-title-light"
            textColor="var(--accent)"
            text={HEADLINE_VARIANTS}
            duration={1.4}
            holdDuration={2.2}
            fadeDuration={0.6}
            repeatDelay={0.5}
            repeat
            fixedWidth
          />
        </h1>
        <p className="sub reveal in">
          Desenvolvemos sistemas exclusivos para transformar processos complexos em operações mais
          simples e eficientes.
        </p>
        <div className="hero-actions reveal in">
          <Button href="#contato" withArrow>
            Quero meu software
          </Button>
        </div>
        <div className="hero-preview">
          <BrandedAppMockup />
        </div>
      </Container>
    </AuroraBackground>
  );
}
