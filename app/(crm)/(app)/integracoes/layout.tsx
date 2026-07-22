import type { ReactNode } from "react";
import { IntegrationsSubNav } from "@/components/integrations/IntegrationsSubNav";
import "@/styles/integrations.css";

export default function IntegracoesLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <div className="crm-page-head">
        <div>
          <h1 className="crm-page-title">Integrações</h1>
          <p className="crm-page-sub">
            Central de conexões do Brusync — publicidade, analytics, comunicação e automação
          </p>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <IntegrationsSubNav />
      </div>

      {children}
    </div>
  );
}
