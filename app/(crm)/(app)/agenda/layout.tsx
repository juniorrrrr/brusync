import type { ReactNode } from "react";
import "@/styles/agenda.css";

export default function AgendaLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <div className="crm-page-head">
        <div>
          <h1 className="crm-page-title">Agenda Comercial</h1>
          <p className="crm-page-sub">
            Central de acompanhamento da rotina comercial — ligações, reuniões, follow-ups e
            propostas
          </p>
        </div>
      </div>

      {children}
    </div>
  );
}
