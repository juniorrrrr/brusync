import type { Metadata } from "next";
import { fetchAiDashboardData } from "@/application/ai/aiQueries";
import {
  AiFavoritesPanel,
  AiRecentQuestionsPanel,
  AiSuggestionsFeed,
} from "@/components/ai/AiDashboardPanels";
import { AiDashboardSummary } from "@/components/ai/AiDashboardSummary";
import { AiFilteredHistory } from "@/components/ai/AiFilteredHistory";
import { AiPromptsList } from "@/components/ai/AiPromptsList";

export const metadata: Metadata = {
  title: "IA — Brusync OS",
};

export default async function IaDashboardPage() {
  const data = await fetchAiDashboardData();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <AiDashboardSummary summary={data.summary} />

      <div className="crm-int-grid">
        <AiRecentQuestionsPanel questions={data.recentQuestions} />
        <AiFavoritesPanel favorites={data.favorites} />
        <div className="crm-card">
          <div className="crm-card-head">
            <div className="crm-card-title">Prompts salvos</div>
          </div>
          <div className="crm-card-pad">
            <AiPromptsList prompts={data.prompts} />
          </div>
        </div>
      </div>

      <AiSuggestionsFeed suggestions={data.suggestions} />

      <AiFilteredHistory conversations={data.history} owners={data.ownerOptions} />
    </div>
  );
}
