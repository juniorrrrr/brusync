import { IntelligenceScoreCard } from "@/components/intelligence/IntelligenceScoreCard";
import { INTELLIGENCE_SCORE_CATEGORIES } from "@/domain/intelligence/types";
import type { IntelligenceScore, IntelligenceScoreCategory } from "@/types/intelligence";

export function IntelligenceScoresGrid({
  scores,
}: {
  scores: Record<IntelligenceScoreCategory, IntelligenceScore>;
}) {
  const ordered: IntelligenceScoreCategory[] = [
    "geral",
    ...INTELLIGENCE_SCORE_CATEGORIES.filter((c) => c !== "geral"),
  ];

  return (
    <div className="crm-int-grid">
      {ordered.map((category) => (
        <IntelligenceScoreCard key={category} score={scores[category]} />
      ))}
    </div>
  );
}
