import type { ReactNode } from "react";
import "@/styles/conversions.css";

export default function ConversoesLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <div className="crm-page-head">
        <div>
          <h1 className="crm-page-title">Conversões</h1>
          <p className="crm-page-sub">
            Conversions Hub — eventos do CRM preparados para plataformas externas
          </p>
        </div>
      </div>

      {children}
    </div>
  );
}
