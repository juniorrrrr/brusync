import { IntelligenceInsightCard } from "@/components/intelligence/IntelligenceInsightCard";
import type { IntelligenceInsight } from "@/types/intelligence";

export function IntelligenceInsightsPanel({ insights }: { insights: IntelligenceInsight[] }) {
  return (
    <div className="crm-card crm-card-pad reveal in">
      <div className="crm-card-head">
        <div>
          <div className="crm-card-title">Insights</div>
          <div className="crm-card-sub">
            Observações geradas pelo motor — {insights.length} ativo
            {insights.length === 1 ? "" : "s"}
          </div>
        </div>
      </div>
      {insights.length === 0 ? (
        <p className="crm-card-sub" style={{ marginTop: 12 }}>
          Nenhum insight identificado no período selecionado.
        </p>
      ) : (
        <div className="crm-int-grid" style={{ marginTop: 10 }}>
          {insights.map((insight) => (
            <IntelligenceInsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      )}
    </div>
  );
}
