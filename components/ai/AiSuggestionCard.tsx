"use client";

import { IconStar } from "@/components/ui/icons";
import { SUGGESTION_SEVERITY_BADGE, SUGGESTION_SEVERITY_LABEL } from "@/domain/ai/statusMeta";
import { useAiSuggestionFavorite } from "@/hooks/ai/useAiSuggestionFavorite";
import type { AiSuggestion } from "@/types/ai";

export function AiSuggestionCard({
  suggestion,
  showFavorite = false,
}: {
  suggestion: AiSuggestion;
  showFavorite?: boolean;
}) {
  return (
    <div className="crm-card crm-card-pad crm-ai-suggestion-card">
      <div className="crm-int-card-top">
        <div className="crm-int-card-title">{suggestion.title}</div>
        <span className={`crm-badge ${SUGGESTION_SEVERITY_BADGE[suggestion.severity]}`}>
          {SUGGESTION_SEVERITY_LABEL[suggestion.severity]}
        </span>
      </div>
      <p className="crm-ai-suggestion-content">{suggestion.content}</p>
      {suggestion.evidence.length > 0 && (
        <div className="crm-proc-card-meta">
          {suggestion.evidence.map((item) => (
            <span key={item.label}>
              {item.label}: {item.value}
            </span>
          ))}
        </div>
      )}
      {showFavorite && (
        <FavoriteButton suggestionId={suggestion.id} initialFavorite={suggestion.isFavorite} />
      )}
    </div>
  );
}

function FavoriteButton({
  suggestionId,
  initialFavorite,
}: {
  suggestionId: string;
  initialFavorite: boolean;
}) {
  const { favorite, toggle, isPending } = useAiSuggestionFavorite(suggestionId, initialFavorite);
  return (
    <button
      type="button"
      className={`crm-icon-btn crm-ai-fav-btn${favorite ? " active" : ""}`}
      disabled={isPending}
      onClick={toggle}
      aria-pressed={favorite}
      aria-label={favorite ? "Remover dos favoritos" : "Favoritar sugestão"}
    >
      <IconStar size={14} />
    </button>
  );
}
