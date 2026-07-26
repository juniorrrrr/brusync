import { AiSuggestionCard } from "@/components/ai/AiSuggestionCard";
import type { AiConversation, AiMessage, AiSuggestion } from "@/types/ai";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function AiRecentQuestionsPanel({ questions }: { questions: AiMessage[] }) {
  return (
    <div className="crm-card">
      <div className="crm-card-head">
        <div className="crm-card-title">Perguntas recentes</div>
      </div>
      <div className="crm-card-pad">
        <div className="crm-mini-list">
          {questions.map((question) => (
            <div key={question.id} className="crm-ai-history-row">
              <span>{question.content}</span>
              <span className="crm-card-sub">{formatDateTime(question.createdAt)}</span>
            </div>
          ))}
          {questions.length === 0 && <p className="crm-card-sub">Nenhuma pergunta ainda.</p>}
        </div>
      </div>
    </div>
  );
}

export function AiFavoritesPanel({ favorites }: { favorites: AiMessage[] }) {
  return (
    <div className="crm-card">
      <div className="crm-card-head">
        <div className="crm-card-title">Favoritos</div>
      </div>
      <div className="crm-card-pad">
        <div className="crm-mini-list">
          {favorites.map((message) => (
            <div key={message.id} className="crm-ai-history-row">
              <span>{message.content}</span>
            </div>
          ))}
          {favorites.length === 0 && (
            <p className="crm-card-sub">Nenhuma resposta favoritada ainda.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function AiHistoryPanel({ conversations }: { conversations: AiConversation[] }) {
  return (
    <div className="crm-card">
      <div className="crm-card-head">
        <div className="crm-card-title">Histórico</div>
      </div>
      <div className="crm-card-pad">
        <div className="crm-mini-list">
          {conversations.map((conversation) => (
            <div key={conversation.id} className="crm-ai-history-row">
              <span>{conversation.title}</span>
              <span className="crm-card-sub">{formatDateTime(conversation.updatedAt)}</span>
            </div>
          ))}
          {conversations.length === 0 && <p className="crm-card-sub">Nenhuma conversa ainda.</p>}
        </div>
      </div>
    </div>
  );
}

export function AiSuggestionsFeed({ suggestions }: { suggestions: AiSuggestion[] }) {
  return (
    <div className="crm-card">
      <div className="crm-card-head">
        <div className="crm-card-title">Sugestões geradas</div>
      </div>
      <div className="crm-card-pad">
        <div className="crm-int-grid">
          {suggestions.map((suggestion) => (
            <AiSuggestionCard key={suggestion.id} suggestion={suggestion} showFavorite />
          ))}
          {suggestions.length === 0 && (
            <p className="crm-card-sub">Nenhuma sugestão gerada ainda.</p>
          )}
        </div>
      </div>
    </div>
  );
}
