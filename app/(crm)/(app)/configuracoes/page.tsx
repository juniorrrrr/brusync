import type { Metadata } from "next";
import { EmptyState } from "@/components/crm/EmptyState";
import { IconSettings } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Configurações — Brusync OS",
  robots: { index: false, follow: false },
};

export default function ConfiguracoesPage() {
  return (
    <div>
      <div className="crm-page-head">
        <div>
          <h1 className="crm-page-title">Configurações</h1>
          <p className="crm-page-sub">Preferências gerais da conta e da organização</p>
        </div>
      </div>

      <EmptyState
        icon={IconSettings}
        title="Configurações em desenvolvimento"
        description="Preferências de conta, organização, notificações e integrações estarão disponíveis aqui em breve."
      />
    </div>
  );
}
