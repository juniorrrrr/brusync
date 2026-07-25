import type { ReactNode } from "react";
import { fetchPerformanceScopeOptions } from "@/application/performance/performanceQueries";
import { GoalEditorModal } from "@/components/performance/GoalEditorModal";
import { PerformanceSubNav } from "@/components/performance/PerformanceSubNav";
import { GoalEditorProvider } from "@/contexts/performance/GoalEditorContext";
import "@/styles/performance.css";

/** GoalEditorProvider/Modal moram aqui (não só em /performance/metas) porque
 * GoalCard — usado em todas as 7 abas — tem um botão "Editar" que chama
 * useGoalEditor(); mesmo padrão de IntelligenceDrillDownProvider montado no
 * layout de /inteligencia para cobrir toda a árvore de rotas do módulo. */
export default async function PerformanceLayout({ children }: { children: ReactNode }) {
  const scopeOptions = await fetchPerformanceScopeOptions();

  return (
    <GoalEditorProvider>
      <div>
        <div className="crm-page-head">
          <div>
            <h1 className="crm-page-title">Performance</h1>
            <p className="crm-page-sub">
              Metas, OKRs e scorecards — acompanhamento automático do desempenho comercial,
              financeiro e de marketing usando os dados já existentes da plataforma.
            </p>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <PerformanceSubNav />
        </div>

        {children}
      </div>
      <GoalEditorModal scopeOptions={scopeOptions} />
    </GoalEditorProvider>
  );
}
