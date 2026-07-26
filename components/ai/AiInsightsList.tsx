import { AiSuggestionCard } from "@/components/ai/AiSuggestionCard";
import type { AiSuggestion } from "@/types/ai";

export function AiInsightsList({ suggestions }: { suggestions: AiSuggestion[] }) {
  if (suggestions.length === 0) {
    return (
      <div className="crm-card crm-card-pad">
        <p className="crm-card-sub">Nenhuma sugestão disponível no momento.</p>
      </div>
    );
  }

  return (
    <div className="crm-int-grid">
      {suggestions.map((suggestion) => (
        <AiSuggestionCard key={suggestion.id} suggestion={suggestion} />
      ))}
    </div>
  );
}
