import type { Metadata } from "next";
import { fetchFinanceiroAssistantSuggestions } from "@/application/ai/aiQueries";
import { AiInsightsList } from "@/components/ai/AiInsightsList";

export const metadata: Metadata = {
  title: "Financeiro — IA — Brusync OS",
};

export default async function IaFinanceiroPage() {
  const suggestions = await fetchFinanceiroAssistantSuggestions();
  return <AiInsightsList suggestions={suggestions} />;
}
