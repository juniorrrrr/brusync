import type { ReactNode } from "react";
import { PlaybookSubNav } from "@/components/playbooks/PlaybookSubNav";
import { PlaybookWorkspaceProvider } from "@/contexts/playbooks/PlaybookWorkspaceContext";

export default function PlaybooksLayout({ children }: { children: ReactNode }) {
  return (
    <PlaybookWorkspaceProvider>
      <div>
        <div className="crm-page-head">
          <div>
            <h1 className="crm-page-title">Playbooks</h1>
            <p className="crm-page-sub">
              Guias comerciais para padronizar o que fazer em cada etapa do funil.
            </p>
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <PlaybookSubNav />
        </div>
        {children}
      </div>
    </PlaybookWorkspaceProvider>
  );
}
