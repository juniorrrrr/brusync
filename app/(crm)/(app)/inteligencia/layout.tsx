import type { ReactNode } from "react";
import { IntelligenceDrillDownPanel } from "@/components/intelligence/IntelligenceDrillDownPanel";
import { IntelligenceDrillDownProvider } from "@/contexts/intelligence/IntelligenceDrillDownContext";
import "@/styles/intelligence.css";

export default function InteligenciaLayout({ children }: { children: ReactNode }) {
  return (
    <IntelligenceDrillDownProvider>
      {children}
      <IntelligenceDrillDownPanel />
    </IntelligenceDrillDownProvider>
  );
}
