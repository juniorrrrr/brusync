import { INTELLIGENCE_CATEGORY_LABEL } from "@/domain/intelligence/types";
import type { IntelligenceCategory } from "@/types/intelligence";

export function CategoryBadge({ category }: { category: IntelligenceCategory }) {
  return <span className="crm-tag">{INTELLIGENCE_CATEGORY_LABEL[category]}</span>;
}
