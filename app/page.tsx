import dynamic from "next/dynamic";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { CTASection } from "@/components/sections/CTASection";
import { DifferentiatorsSection } from "@/components/sections/DifferentiatorsSection";
import { Hero } from "@/components/sections/Hero";
import { IntelligenceSection } from "@/components/sections/IntelligenceSection";
import { ProblemSection } from "@/components/sections/ProblemSection";
import { ProcessTimeline } from "@/components/sections/ProcessTimeline";
import { SolutionSection } from "@/components/sections/SolutionSection";

const IntegrationsSection = dynamic(() =>
  import("@/components/sections/IntegrationsSection").then((m) => m.IntegrationsSection),
);

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <IntegrationsSection />
      <ProblemSection />
      <SolutionSection />
      <IntelligenceSection />
      <DifferentiatorsSection />
      <ProcessTimeline />
      <CTASection />
      <Footer />
    </>
  );
}
