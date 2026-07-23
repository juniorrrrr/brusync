import type { ReactNode } from "react";
import "@/styles/projects.css";

export default function ProjetosLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <div className="crm-page-head">
        <div>
          <h1 className="crm-page-title">Projetos</h1>
          <p className="crm-page-sub">
            Ambiente de implantação — do diagnóstico à entrega, um projeto por vez
          </p>
        </div>
      </div>

      {children}
    </div>
  );
}
