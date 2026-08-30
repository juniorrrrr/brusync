import dynamic from "next/dynamic";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { CTASection } from "@/components/sections/CTASection";
import { DifferentiatorsSection } from "@/components/sections/DifferentiatorsSection";
import { Hero } from "@/components/sections/Hero";
import { SocialProofSection } from "@/components/sections/SocialProofSection";
import { SolutionSection } from "@/components/sections/SolutionSection";
import { TransformationSection } from "@/components/sections/TransformationSection";

const SolutionsGridSection = dynamic(() =>
  import("@/components/sections/SolutionsGridSection").then((m) => m.SolutionsGridSection),
);

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <TransformationSection />
      <DifferentiatorsSection />
      <SolutionSection />
      <SolutionsGridSection />
      <SocialProofSection />
      <CTASection />
      <Footer />
    </>
  );
}
