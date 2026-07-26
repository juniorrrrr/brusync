import type { Metadata } from "next";
import { fetchMarketingAssistantSuggestions } from "@/application/ai/aiQueries";
import { AiInsightsList } from "@/components/ai/AiInsightsList";

export const metadata: Metadata = {
  title: "Marketing — IA — Brusync OS",
};

export default async function IaMarketingPage() {
  const suggestions = await fetchMarketingAssistantSuggestions();
  return <AiInsightsList suggestions={suggestions} />;
}
