import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchKnowledgeCategories } from "@/application/knowledge/knowledgeCategoriesActions";
import { fetchKnowledgeDocumentDetail } from "@/application/knowledge/knowledgeDocumentsActions";
import { KnowledgeDocumentForm } from "@/components/knowledge/KnowledgeDocumentForm";

export const metadata: Metadata = {
  title: "Editar documento — Base de Conhecimento",
};

export default async function EditarDocumentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [categories, document] = await Promise.all([
    fetchKnowledgeCategories(),
    fetchKnowledgeDocumentDetail(id),
  ]);

  if (!document) notFound();

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--primary)" }}>Editar documento</h1>
      <p className="crm-card-sub" style={{ marginTop: 4, marginBottom: 20 }}>
        {document.title}
      </p>
      <KnowledgeDocumentForm categories={categories} initialDocument={document} />
    </div>
  );
}
