import Link from "next/link";
import { KnowledgeStatusBadge } from "@/components/knowledge/KnowledgeStatusBadge";
import { IconEye } from "@/components/ui/icons";
import type { KnowledgeDocumentSummary } from "@/types/knowledge";

export function KnowledgeDocumentListPanel({
  title,
  subtitle,
  documents,
  emptyMessage,
  showViews = true,
}: {
  title: string;
  subtitle: string;
  documents: KnowledgeDocumentSummary[];
  emptyMessage: string;
  showViews?: boolean;
}) {
  return (
    <div className="crm-card crm-card-pad reveal in">
      <div className="crm-card-head">
        <div>
          <div className="crm-card-title">{title}</div>
          <div className="crm-card-sub">{subtitle}</div>
        </div>
      </div>
      {documents.length === 0 ? (
        <p className="crm-card-sub" style={{ marginTop: 12 }}>
          {emptyMessage}
        </p>
      ) : (
        <div className="crm-mini-list">
          {documents.map((doc) => (
            <Link
              key={doc.id}
              href={`/base-conhecimento/documentos/${doc.id}`}
              className="crm-mini-row"
            >
              <span className="crm-mini-ico">•</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="crm-mini-title">{doc.title}</div>
                <div className="crm-mini-meta">{doc.categoryName ?? "Sem categoria"}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {showViews && (
                  <span
                    className="crm-mini-trail"
                    style={{ display: "flex", alignItems: "center", gap: 3 }}
                  >
                    <IconEye size={12} /> {doc.viewCount}
                  </span>
                )}
                <KnowledgeStatusBadge status={doc.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
