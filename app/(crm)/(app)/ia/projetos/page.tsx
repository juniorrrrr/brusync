import type { Metadata } from "next";
import { fetchProjetosAssistantSuggestions } from "@/application/ai/aiQueries";
import { AiInsightsList } from "@/components/ai/AiInsightsList";

export const metadata: Metadata = {
  title: "Projetos — IA — Brusync OS",
};

export default async function IaProjetosPage() {
  const suggestions = await fetchProjetosAssistantSuggestions();
  return <AiInsightsList suggestions={suggestions} />;
}
