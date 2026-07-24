import { KNOWLEDGE_STATUS_LABEL, knowledgeStatusBadge } from "@/domain/knowledge/types";
import type { KnowledgeDocumentStatus } from "@/types/knowledge";

export function KnowledgeStatusBadge({ status }: { status: KnowledgeDocumentStatus }) {
  return (
    <span className={`crm-badge ${knowledgeStatusBadge(status)}`}>
      {KNOWLEDGE_STATUS_LABEL[status]}
    </span>
  );
}
