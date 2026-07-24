"use client";

import { CategoryIcon } from "@/components/knowledge/CategoryIcon";
import { IconPlus } from "@/components/ui/icons";
import { useKnowledgeCategoryDialog } from "@/contexts/knowledge/KnowledgeCategoryDialogContext";
import { useUpdateSearchParams } from "@/hooks/crm/useUpdateSearchParams";
import type { KnowledgeCategory } from "@/types/knowledge";

export function KnowledgeCategoryGrid({ categories }: { categories: KnowledgeCategory[] }) {
  const { openCreate, openEdit } = useKnowledgeCategoryDialog();
  const { update, searchParams } = useUpdateSearchParams();
  const activeCategoryId = searchParams.get("categoryId");

  return (
    <div className="crm-kb-category-grid">
      <button
        type="button"
        className={`crm-kb-category-card${activeCategoryId === null ? " active" : ""}`}
        onClick={() => update({ categoryId: null }, { resetPage: true })}
      >
        <CategoryIcon icon="doc" color="neutral" />
        <div>
          <div className="crm-kb-category-name">Todas</div>
          <div className="crm-kb-category-count">
            {categories.reduce((sum, c) => sum + c.documentCount, 0)} documentos
          </div>
        </div>
      </button>

      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          className={`crm-kb-category-card${activeCategoryId === category.id ? " active" : ""}`}
          onClick={() => update({ categoryId: category.id }, { resetPage: true })}
          onDoubleClick={() => openEdit(category)}
          title="Duplo clique para editar"
        >
          <CategoryIcon icon={category.icon} color={category.color} />
          <div>
            <div className="crm-kb-category-name">{category.name}</div>
            <div className="crm-kb-category-count">{category.documentCount} documentos</div>
          </div>
        </button>
      ))}

      <button type="button" className="crm-kb-category-card" onClick={openCreate}>
        <span className="crm-kb-category-ico" style={{ background: "var(--surface)" }}>
          <IconPlus size={16} />
        </span>
        <div>
          <div className="crm-kb-category-name">Nova categoria</div>
          <div className="crm-kb-category-count">Personalizada</div>
        </div>
      </button>
    </div>
  );
}
