import { BrusyncSystemAnimation } from "@/components/dashboard-mock/BrusyncSystemAnimation";
import { BrusyncSystemAnimationMobile } from "@/components/dashboard-mock/BrusyncSystemAnimationMobile";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";

export function SolutionSection() {
  return (
    <section className="solution" id="solucao">
      <div className="ambient" aria-hidden="true">
        <div
          className="orb orb-teal d1"
          style={{ width: 360, height: 360, top: -100, right: -90 }}
        />
        <div
          className="orb orb-blue d2"
          style={{ width: 320, height: 320, bottom: -90, left: -80 }}
        />
        <div className="grid-lines" style={{ opacity: 0.5 }} />
      </div>
      <Container className="sol-video">
        <Reveal>
          <BrusyncSystemAnimation />
          <BrusyncSystemAnimationMobile />
        </Reveal>
      </Container>
    </section>
  );
}
