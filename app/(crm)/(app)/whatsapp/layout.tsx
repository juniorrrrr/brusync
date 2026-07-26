import type { ReactNode } from "react";
import { WhatsappSubNav } from "@/components/whatsapp/WhatsappSubNav";
import "@/styles/whatsapp.css";

export default function WhatsappLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <div className="crm-page-head">
        <div>
          <h1 className="crm-page-title">WhatsApp</h1>
          <p className="crm-page-sub">
            WhatsApp Business Cloud API (Meta oficial) — conversas, templates e automações, sempre
            através do WhatsappProvider.
          </p>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <WhatsappSubNav />
      </div>

      {children}
    </div>
  );
}
