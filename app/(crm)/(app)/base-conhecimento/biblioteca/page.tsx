import type { Metadata } from "next";
import Link from "next/link";
import { fetchKnowledgeCategories } from "@/application/knowledge/knowledgeCategoriesActions";
import { fetchKnowledgeDocuments } from "@/application/knowledge/knowledgeDocumentsActions";
import { KnowledgeCategoryGrid } from "@/components/knowledge/KnowledgeCategoryGrid";
import { KnowledgeDocumentCard } from "@/components/knowledge/KnowledgeDocumentCard";
import { KnowledgeFilterBar } from "@/components/knowledge/KnowledgeFilterBar";
import type { KnowledgeContentType, KnowledgeDocumentStatus } from "@/types/knowledge";

export const metadata: Metadata = {
  title: "Biblioteca — Base de Conhecimento",
};

export default async function BibliotecaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; contentType?: string; categoryId?: string }>;
}) {
  const params = await searchParams;

  const [categories, { documents, total }] = await Promise.all([
    fetchKnowledgeCategories(),
    fetchKnowledgeDocuments({
      search: params.q,
      status: (params.status as KnowledgeDocumentStatus) || undefined,
      contentType: (params.contentType as KnowledgeContentType) || undefined,
      categoryId: params.categoryId || undefined,
      limit: 60,
    }),
  ]);

  return (
    <div>
      <div className="crm-card-head">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--primary)" }}>Biblioteca</h1>
          <p className="crm-card-sub" style={{ marginTop: 4 }}>
            {total} documento{total === 1 ? "" : "s"}
          </p>
        </div>
        <Link href="/base-conhecimento/documentos/novo" className="btn btn-accent">
          Novo documento
        </Link>
      </div>

      <div style={{ marginTop: 16 }}>
        <KnowledgeCategoryGrid categories={categories} />
      </div>

      <div style={{ marginTop: 20 }}>
        <KnowledgeFilterBar />
      </div>

      <div style={{ marginTop: 16 }}>
        {documents.length === 0 ? (
          <div className="crm-empty">
            <div className="crm-empty-ico">📄</div>
            <p>Nenhum documento encontrado com esses filtros.</p>
          </div>
        ) : (
          <div className="crm-kb-doc-grid">
            {documents.map((doc) => (
              <KnowledgeDocumentCard key={doc.id} document={doc} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
