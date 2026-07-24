"use client";

import { useState } from "react";
import { KnowledgeDocumentForm } from "@/components/knowledge/KnowledgeDocumentForm";
import { KnowledgeTemplatePicker } from "@/components/knowledge/KnowledgeTemplatePicker";
import type { KnowledgeCategory, KnowledgeTemplate } from "@/types/knowledge";

export function NewKnowledgeDocumentFlow({ categories }: { categories: KnowledgeCategory[] }) {
  const [picked, setPicked] = useState<KnowledgeTemplate | "blank" | null>(null);

  if (!picked) {
    return (
      <div>
        <p className="crm-card-sub" style={{ marginBottom: 14 }}>
          Comece do zero ou use um modelo pronto.
        </p>
        <KnowledgeTemplatePicker onSelect={setPicked} onBlank={() => setPicked("blank")} />
      </div>
    );
  }

  return (
    <KnowledgeDocumentForm
      categories={categories}
      defaultContentType={picked === "blank" ? undefined : picked.contentType}
      defaultTitle={picked === "blank" ? undefined : picked.name}
      initialBlocks={picked === "blank" ? undefined : picked.blocks}
    />
  );
}
