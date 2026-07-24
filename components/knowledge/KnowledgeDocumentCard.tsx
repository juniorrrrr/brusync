import Link from "next/link";
import { CategoryIcon } from "@/components/knowledge/CategoryIcon";
import { KnowledgeFavoriteButton } from "@/components/knowledge/KnowledgeFavoriteButton";
import { KnowledgePinButton } from "@/components/knowledge/KnowledgePinButton";
import { KnowledgeStatusBadge } from "@/components/knowledge/KnowledgeStatusBadge";
import { IconEye } from "@/components/ui/icons";
import { KNOWLEDGE_CONTENT_TYPE_LABEL } from "@/domain/knowledge/types";
import type { KnowledgeDocumentSummary } from "@/types/knowledge";

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "hoje";
  if (days === 1) return "ontem";
  if (days < 30) return `há ${days} dias`;
  const months = Math.floor(days / 30);
  if (months < 12) return `há ${months} ${months === 1 ? "mês" : "meses"}`;
  const years = Math.floor(months / 12);
  return `há ${years} ${years === 1 ? "ano" : "anos"}`;
}

export function KnowledgeDocumentCard({
  document,
  showPin = false,
}: {
  document: KnowledgeDocumentSummary;
  showPin?: boolean;
}) {
  return (
    <Link href={`/base-conhecimento/documentos/${document.id}`} className="crm-kb-doc-card">
      <div className="crm-kb-doc-card-top">
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          {document.categoryColor && (
            <CategoryIcon
              icon={document.categoryIcon ?? "doc"}
              color={document.categoryColor}
              size={14}
            />
          )}
          <span className="crm-kb-doc-title">{document.title}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {showPin && (
            <KnowledgePinButton documentId={document.id} initialPinned={document.isPinned} />
          )}
          <KnowledgeFavoriteButton documentId={document.id} initialFavorite={document.isFavorite} />
        </div>
      </div>

      {document.summary && <p className="crm-kb-doc-summary">{document.summary}</p>}

      {document.tags.length > 0 && (
        <div className="crm-kb-doc-tags">
          {document.tags.slice(0, 4).map((tag) => (
            <span key={tag.id} className="crm-tag">
              {tag.name}
            </span>
          ))}
        </div>
      )}

      <div className="crm-kb-doc-meta">
        <KnowledgeStatusBadge status={document.status} />
        <span>{KNOWLEDGE_CONTENT_TYPE_LABEL[document.contentType]}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <IconEye size={13} /> {document.viewCount}
        </span>
        <span>{document.categoryName ?? "Sem categoria"}</span>
        <span>Atualizado {formatRelativeDate(document.updatedAt)}</span>
      </div>
    </Link>
  );
}
