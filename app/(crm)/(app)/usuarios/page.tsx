import type { Metadata } from "next";
import { EmptyState } from "@/components/crm/EmptyState";
import { IconUsers } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Usuários — Brusync OS",
  robots: { index: false, follow: false },
};

export default function UsuariosPage() {
  return (
    <div>
      <div className="crm-page-head">
        <div>
          <h1 className="crm-page-title">Usuários</h1>
          <p className="crm-page-sub">Gestão de usuários, papéis e permissões</p>
        </div>
      </div>

      <EmptyState
        icon={IconUsers}
        title="Gestão de usuários em desenvolvimento"
        description="Convites, papéis (administrador, gestor, comercial, atendimento, cliente) e permissões por módulo serão gerenciados aqui."
      />
    </div>
  );
}
