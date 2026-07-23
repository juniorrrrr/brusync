import type { ReactNode } from "react";
import { AutomationSubNav } from "@/components/automation/AutomationSubNav";
import "@/styles/automation.css";

export default function AutomacoesLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <div className="crm-page-head">
        <div>
          <h1 className="crm-page-title">Automações</h1>
          <p className="crm-page-sub">
            Motor de automações do Brusync — regras SE → CONDIÇÃO → AÇÃO reaproveitadas por todo o
            CRM
          </p>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <AutomationSubNav />
      </div>

      {children}
    </div>
  );
}
