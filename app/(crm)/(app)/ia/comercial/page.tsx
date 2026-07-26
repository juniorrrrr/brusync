import type { Metadata } from "next";
import { fetchComercialAssistantSuggestions } from "@/application/ai/aiQueries";
import { AiInsightsList } from "@/components/ai/AiInsightsList";

export const metadata: Metadata = {
  title: "Comercial — IA — Brusync OS",
};

export default async function IaComercialPage() {
  const suggestions = await fetchComercialAssistantSuggestions();
  return <AiInsightsList suggestions={suggestions} />;
}
