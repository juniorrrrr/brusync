import type { Metadata } from "next";
import {
  fetchKnowledgeFavoriteDocuments,
  fetchKnowledgeMostAccessedDocuments,
  fetchKnowledgeRecentDocuments,
} from "@/application/knowledge/knowledgeFavoritesActions";
import { KnowledgeDocumentCard } from "@/components/knowledge/KnowledgeDocumentCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = {
  title: "Favoritos — Base de Conhecimento",
};

export default async function FavoritosPage() {
  const [favorites, recent, mostAccessed] = await Promise.all([
    fetchKnowledgeFavoriteDocuments(),
    fetchKnowledgeRecentDocuments(12),
    fetchKnowledgeMostAccessedDocuments(12),
  ]);

  const sortedFavorites = [...favorites].sort((a, b) => Number(b.isPinned) - Number(a.isPinned));

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--primary)" }}>Favoritos</h1>
      <p className="crm-card-sub" style={{ marginTop: 4, marginBottom: 20 }}>
        Documentos favoritados, fixados, recentes e mais acessados.
      </p>

      <Tabs defaultValue="favoritos">
        <TabsList>
          <TabsTrigger value="favoritos">Favoritos ({sortedFavorites.length})</TabsTrigger>
          <TabsTrigger value="recentes">Recentes</TabsTrigger>
          <TabsTrigger value="acessados">Mais acessados</TabsTrigger>
        </TabsList>
        <TabsContent value="favoritos">
          {sortedFavorites.length === 0 ? (
            <p className="crm-card-sub">Nenhum documento favoritado ainda.</p>
          ) : (
            <div className="crm-kb-doc-grid">
              {sortedFavorites.map((doc) => (
                <KnowledgeDocumentCard key={doc.id} document={doc} showPin />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="recentes">
          <div className="crm-kb-doc-grid">
            {recent.map((doc) => (
              <KnowledgeDocumentCard key={doc.id} document={doc} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="acessados">
          <div className="crm-kb-doc-grid">
            {mostAccessed.map((doc) => (
              <KnowledgeDocumentCard key={doc.id} document={doc} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
