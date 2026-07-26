import type { ReactNode } from "react";
import { fetchProcessFormOptions } from "@/application/processes/processesQueries";
import { ProcessEditorModal } from "@/components/processes/ProcessEditorModal";
import { ProcessSubNav } from "@/components/processes/ProcessSubNav";
import { ProcessEditorProvider } from "@/contexts/processes/ProcessEditorContext";
import "@/styles/processes.css";

/** ProcessEditorProvider/Modal moram aqui (não só numa página) porque
 * ProcessCard — usado no Dashboard, na Lista e no Detalhe — tem um botão
 * "Editar" que chama useProcessEditor(); mesmo padrão de
 * GoalEditorProvider montado no layout de /performance na Fase 23. */
export default async function ProcessesLayout({ children }: { children: ReactNode }) {
  const formOptions = await fetchProcessFormOptions();

  return (
    <ProcessEditorProvider>
      <div>
        <div className="crm-page-head">
          <div>
            <h1 className="crm-page-title">Processos</h1>
            <p className="crm-page-sub">
              Documentação, padronização e execução dos processos internos da Brusync.
            </p>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <ProcessSubNav />
        </div>

        {children}
      </div>
      <ProcessEditorModal formOptions={formOptions} />
    </ProcessEditorProvider>
  );
}
