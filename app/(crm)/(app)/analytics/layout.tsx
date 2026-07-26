import type { ReactNode } from "react";
import { IntelligenceHubNav } from "@/components/intelligence/IntelligenceHubNav";
import "@/styles/analytics.css";

export default function AnalyticsLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <div className="crm-page-head">
        <div>
          <h1 className="crm-page-title">Analytics</h1>
          <p className="crm-page-sub">
            Construtor de dashboards — reaproveita os dados já existentes do CRM, Marketing,
            Financeiro, Projetos, Equipe, Performance, Inteligência e IA.
          </p>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <IntelligenceHubNav />
      </div>

      {children}
    </div>
  );
}
