"use client";

import { KNOWLEDGE_TEMPLATES } from "@/domain/knowledge/templates";
import type { KnowledgeTemplate } from "@/types/knowledge";

export function KnowledgeTemplatePicker({
  onSelect,
  onBlank,
}: {
  onSelect: (template: KnowledgeTemplate) => void;
  onBlank: () => void;
}) {
  return (
    <div className="crm-kb-doc-grid">
      <button
        type="button"
        className="crm-kb-doc-card"
        onClick={onBlank}
        style={{ alignItems: "center", justifyContent: "center", minHeight: 90 }}
      >
        <span className="crm-kb-doc-title">Documento em branco</span>
      </button>
      {KNOWLEDGE_TEMPLATES.map((template) => (
        <button
          key={template.key}
          type="button"
          className="crm-kb-doc-card"
          onClick={() => onSelect(template)}
        >
          <span className="crm-kb-doc-title">{template.name}</span>
          <span className="crm-kb-doc-summary">{template.description}</span>
        </button>
      ))}
    </div>
  );
}
