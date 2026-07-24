import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  fetchKnowledgeDocumentDetail,
  recordKnowledgeDocumentViewAction,
} from "@/application/knowledge/knowledgeDocumentsActions";
import { fetchKnowledgeEffectivePermissions } from "@/application/knowledge/knowledgePermissionsActions";
import { fetchKnowledgeDocumentVersions } from "@/application/knowledge/knowledgeVersionsActions";
import { CategoryIcon } from "@/components/knowledge/CategoryIcon";
import { KnowledgeBlockRenderer } from "@/components/knowledge/KnowledgeBlockRenderer";
import { KnowledgeDocumentActionsBar } from "@/components/knowledge/KnowledgeDocumentActionsBar";
import { KnowledgeFavoriteButton } from "@/components/knowledge/KnowledgeFavoriteButton";
import { KnowledgeFileList } from "@/components/knowledge/KnowledgeFileList";
import { KnowledgePermissionsPanel } from "@/components/knowledge/KnowledgePermissionsPanel";
import { KnowledgeStatusBadge } from "@/components/knowledge/KnowledgeStatusBadge";
import { KnowledgeStatusSelect } from "@/components/knowledge/KnowledgeStatusSelect";
import { KnowledgeVersionHistoryPanel } from "@/components/knowledge/KnowledgeVersionHistoryPanel";
import { IconEye } from "@/components/ui/icons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KNOWLEDGE_CONTENT_TYPE_LABEL } from "@/domain/knowledge/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const document = await fetchKnowledgeDocumentDetail(id);
  return {
    title: document ? `${document.title} — Base de Conhecimento` : "Documento não encontrado",
  };
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export default async function DocumentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const document = await fetchKnowledgeDocumentDetail(id);
  if (!document) notFound();

  const [versions, permissions] = await Promise.all([
    fetchKnowledgeDocumentVersions(id),
    fetchKnowledgeEffectivePermissions(id, document.categoryId, document.createdBy),
    recordKnowledgeDocumentViewAction(id),
  ]);

  return (
    <div>
      <div className="crm-back-link">
        <Link href="/base-conhecimento/biblioteca">← Voltar para a biblioteca</Link>
      </div>

      <div className="crm-card-head" style={{ marginTop: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {document.categoryColor && (
            <CategoryIcon
              icon={document.categoryIcon ?? "doc"}
              color={document.categoryColor}
              size={22}
            />
          )}
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--primary)" }}>
              {document.title}
            </h1>
            <div
              className="crm-card-sub"
              style={{ marginTop: 4, display: "flex", gap: 10, alignItems: "center" }}
            >
              <KnowledgeStatusBadge status={document.status} />
              <span>{KNOWLEDGE_CONTENT_TYPE_LABEL[document.contentType]}</span>
              <span>{document.categoryName ?? "Sem categoria"}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <IconEye size={13} /> {document.viewCount}
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <KnowledgeFavoriteButton documentId={document.id} initialFavorite={document.isFavorite} />
          <KnowledgeDocumentActionsBar
            documentId={document.id}
            canEdit={permissions.canEdit}
            canDelete={permissions.canDelete}
            canDuplicate={permissions.canDuplicate}
          />
        </div>
      </div>

      <div style={{ marginTop: 10 }}>
        <KnowledgeStatusSelect
          documentId={document.id}
          status={document.status}
          canPublish={permissions.canPublish}
        />
      </div>

      {document.summary && (
        <p className="crm-card-sub" style={{ marginTop: 14, fontSize: 14 }}>
          {document.summary}
        </p>
      )}

      {document.tags.length > 0 && (
        <div className="crm-tags" style={{ marginTop: 10 }}>
          {document.tags.map((tag) => (
            <span key={tag.id} className="crm-tag">
              {tag.name}
            </span>
          ))}
        </div>
      )}

      <div className="crm-info-list" style={{ marginTop: 16 }}>
        <div className="crm-info-row">
          <span className="crm-info-row-label">Autor</span>
          <span className="crm-info-row-value">{document.createdByName ?? "—"}</span>
        </div>
        <div className="crm-info-row">
          <span className="crm-info-row-label">Última atualização</span>
          <span className="crm-info-row-value">
            {formatDateTime(document.updatedAt)}{" "}
            {document.updatedByName ? `· ${document.updatedByName}` : ""}
          </span>
        </div>
        {document.publishedAt && (
          <div className="crm-info-row">
            <span className="crm-info-row-label">Publicado em</span>
            <span className="crm-info-row-value">
              {formatDateTime(document.publishedAt)}{" "}
              {document.publishedByName ? `· ${document.publishedByName}` : ""}
            </span>
          </div>
        )}
        {document.clientCompany && (
          <div className="crm-info-row">
            <span className="crm-info-row-label">Cliente</span>
            <span className="crm-info-row-value">{document.clientCompany}</span>
          </div>
        )}
        {document.projectName && (
          <div className="crm-info-row">
            <span className="crm-info-row-label">Projeto</span>
            <span className="crm-info-row-value">{document.projectName}</span>
          </div>
        )}
        {document.crmLeadName && (
          <div className="crm-info-row">
            <span className="crm-info-row-label">Lead</span>
            <span className="crm-info-row-value">{document.crmLeadName}</span>
          </div>
        )}
        {document.contentType === "link_externo" && document.externalUrl && (
          <div className="crm-info-row">
            <span className="crm-info-row-label">Link externo</span>
            <a
              href={document.externalUrl}
              target="_blank"
              rel="noreferrer"
              className="crm-info-row-value"
            >
              {document.externalUrl}
            </a>
          </div>
        )}
      </div>

      <div className="crm-card crm-card-pad" style={{ marginTop: 20 }}>
        <Tabs defaultValue="conteudo">
          <TabsList>
            <TabsTrigger value="conteudo">Conteúdo</TabsTrigger>
            <TabsTrigger value="versoes">Versões ({versions.length})</TabsTrigger>
            <TabsTrigger value="arquivos">Arquivos ({document.files.length})</TabsTrigger>
            {permissions.canApprove && <TabsTrigger value="permissoes">Permissões</TabsTrigger>}
          </TabsList>
          <TabsContent value="conteudo">
            <KnowledgeBlockRenderer blocks={document.contentJson} />
          </TabsContent>
          <TabsContent value="versoes">
            <KnowledgeVersionHistoryPanel documentId={document.id} versions={versions} />
          </TabsContent>
          <TabsContent value="arquivos">
            <KnowledgeFileList files={document.files} documentId={document.id} />
          </TabsContent>
          {permissions.canApprove && (
            <TabsContent value="permissoes">
              <KnowledgePermissionsPanel documentId={document.id} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
