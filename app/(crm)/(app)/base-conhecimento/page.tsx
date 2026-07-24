import type { Metadata } from "next";
import Link from "next/link";
import { fetchKnowledgeDashboardData } from "@/application/knowledge/knowledgeDashboardQueries";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { KnowledgeCategoryUsagePanel } from "@/components/knowledge/KnowledgeCategoryUsagePanel";
import { KnowledgeDocumentListPanel } from "@/components/knowledge/KnowledgeDocumentListPanel";
import { KnowledgeGlobalSearch } from "@/components/knowledge/KnowledgeGlobalSearch";
import { IconBook, IconDoc, IconEye, IconFolder, IconStar } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Base de Conhecimento — Brusync OS",
};

export default async function BaseConhecimentoPage() {
  const data = await fetchKnowledgeDashboardData();

  return (
    <div>
      <div className="crm-card-head">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--primary)" }}>
            Base de Conhecimento
          </h1>
          <p className="crm-card-sub" style={{ marginTop: 4 }}>
            Toda a documentação da empresa em um único lugar — playbooks, procedimentos, políticas e
            mais.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/base-conhecimento/biblioteca" className="btn btn-outline">
            Ver biblioteca
          </Link>
          <Link href="/base-conhecimento/documentos/novo" className="btn btn-accent">
            Novo documento
          </Link>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <KnowledgeGlobalSearch />
      </div>

      <div className="crm-kpi-grid" style={{ marginTop: 20 }}>
        <KpiCard label="Documentos" value={data.documentsCount} icon={IconDoc} />
        <KpiCard label="Categorias" value={data.categoriesCount} icon={IconFolder} />
        <KpiCard label="Arquivos" value={data.filesCount} icon={IconBook} />
        <KpiCard label="Visualizações" value={data.viewsCount} icon={IconEye} />
        <KpiCard label="Favoritos" value={data.favoritesCount} icon={IconStar} />
        <KpiCard label="Publicados" value={data.publishedCount} icon={IconDoc} />
        <KpiCard label="Rascunhos" value={data.draftCount} icon={IconDoc} />
      </div>

      <div className="crm-fin-charts-row" style={{ marginTop: 20 }}>
        <KnowledgeDocumentListPanel
          title="Documentos recentes"
          subtitle="Criados mais recentemente"
          documents={data.recentDocuments}
          emptyMessage="Nenhum documento criado ainda."
        />
        <KnowledgeDocumentListPanel
          title="Últimas atualizações"
          subtitle="Alterados mais recentemente"
          documents={data.recentlyUpdated}
          emptyMessage="Nenhuma atualização registrada."
        />
      </div>

      <div className="crm-fin-charts-row" style={{ marginTop: 16 }}>
        <KnowledgeDocumentListPanel
          title="Documentos mais acessados"
          subtitle="Maior número de visualizações"
          documents={data.mostAccessed}
          emptyMessage="Nenhuma visualização registrada ainda."
        />
        <KnowledgeDocumentListPanel
          title="Sem atualização há muito tempo"
          subtitle="Mais de 90 dias sem alteração"
          documents={data.staleDocuments}
          emptyMessage="Nenhum documento desatualizado."
          showViews={false}
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <KnowledgeCategoryUsagePanel usage={data.categoryUsage} />
      </div>
    </div>
  );
}
