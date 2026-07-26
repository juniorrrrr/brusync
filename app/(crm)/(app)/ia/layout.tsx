import type { ReactNode } from "react";
import { AiSubNav } from "@/components/ai/AiSubNav";
import "@/styles/ai.css";

export default function IaLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <div className="crm-page-head">
        <div>
          <h1 className="crm-page-title">Brusync AI</h1>
          <p className="crm-page-sub">
            Assistente operacional que consulta os dados já existentes do CRM — sem integração com
            provedores externos nesta fase.
          </p>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <AiSubNav />
      </div>

      {children}
    </div>
  );
}
