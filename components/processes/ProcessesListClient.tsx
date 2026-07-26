"use client";

import { ProcessCard } from "@/components/processes/ProcessCard";
import { IconPlus } from "@/components/ui/icons";
import { useProcessEditor } from "@/contexts/processes/ProcessEditorContext";
import type { ProcessSummary } from "@/types/processes";

function NewProcessButton() {
  const { openCreate } = useProcessEditor();
  return (
    <button type="button" className="btn btn-accent" onClick={openCreate}>
      <IconPlus size={14} /> Novo processo
    </button>
  );
}

/** ProcessEditorProvider/ProcessEditorModal já estão montados no layout de
 * /processos (ProcessCard usa useProcessEditor() em várias telas), então
 * este componente só precisa do botão e da listagem. */
export function ProcessesListClient({
  processes,
  total,
}: {
  processes: ProcessSummary[];
  total: number;
}) {
  return (
    <>
      <div className="crm-card-head">
        <div className="crm-card-title">Processos ({total})</div>
        <NewProcessButton />
      </div>
      <div className="crm-int-grid" style={{ marginTop: 12 }}>
        {processes.map((process) => (
          <ProcessCard key={process.id} process={process} />
        ))}
        {processes.length === 0 && (
          <p className="crm-card-sub">Nenhum processo encontrado para os filtros atuais.</p>
        )}
      </div>
    </>
  );
}
