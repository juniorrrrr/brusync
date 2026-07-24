import type { Metadata } from "next";
import { fetchKnowledgeCategories } from "@/application/knowledge/knowledgeCategoriesActions";
import { NewKnowledgeDocumentFlow } from "@/components/knowledge/NewKnowledgeDocumentFlow";

export const metadata: Metadata = {
  title: "Novo documento — Base de Conhecimento",
};

export default async function NovoDocumentoPage() {
  const categories = await fetchKnowledgeCategories();

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--primary)" }}>Novo documento</h1>
      <p className="crm-card-sub" style={{ marginTop: 4, marginBottom: 20 }}>
        Escolha um modelo ou comece do zero.
      </p>
      <NewKnowledgeDocumentFlow categories={categories} />
    </div>
  );
}
