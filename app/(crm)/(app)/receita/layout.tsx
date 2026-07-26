import type { ReactNode } from "react";
import { IntelligenceDrillDownPanel } from "@/components/intelligence/IntelligenceDrillDownPanel";
import { IntelligenceHubNav } from "@/components/intelligence/IntelligenceHubNav";
import { RevenueSubNav } from "@/components/revenueIntelligence/RevenueSubNav";
import { IntelligenceDrillDownProvider } from "@/contexts/intelligence/IntelligenceDrillDownContext";
import "@/styles/revenueIntelligence.css";

/** IntelligenceDrillDownProvider é reaproveitado (não duplicado) porque a
 * aba "Alertas & Insights" reaproveita IntelligenceAlertCard tal qual — os
 * alertas ali são os mesmos objetos IntelligenceAlert da Fase 19, e o card
 * chama useIntelligenceDrillDown() internamente para o "Ver dados". */
export default function ReceitaLayout({ children }: { children: ReactNode }) {
  return (
    <IntelligenceDrillDownProvider>
      <div>
        <div className="crm-page-head">
          <div>
            <h1 className="crm-page-title">Revenue Intelligence</h1>
            <p className="crm-page-sub">
              Previsão de receita, conversão, rankings e detecção automática de oportunidades e
              riscos — tudo derivado dos dados já existentes do CRM, Marketing, Financeiro e
              Inteligência Operacional.
            </p>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <IntelligenceHubNav />
        </div>

        <div style={{ marginBottom: 16 }}>
          <RevenueSubNav />
        </div>

        {children}
      </div>
      <IntelligenceDrillDownPanel />
    </IntelligenceDrillDownProvider>
  );
}
