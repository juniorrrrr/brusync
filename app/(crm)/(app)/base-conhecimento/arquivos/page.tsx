import type { Metadata } from "next";
import { fetchKnowledgeFileLibrary } from "@/application/knowledge/knowledgeFilesActions";
import { KnowledgeFileList } from "@/components/knowledge/KnowledgeFileList";

export const metadata: Metadata = {
  title: "Arquivos — Base de Conhecimento",
};

export default async function ArquivosPage() {
  const { files, total } = await fetchKnowledgeFileLibrary({ limit: 100 });

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--primary)" }}>
        Biblioteca de Arquivos
      </h1>
      <p className="crm-card-sub" style={{ marginTop: 4, marginBottom: 20 }}>
        {total} arquivo{total === 1 ? "" : "s"} — imagens, PDFs, planilhas, apresentações, ZIPs e
        vídeos.
      </p>

      <KnowledgeFileList files={files} documentId={null} />
    </div>
  );
}
