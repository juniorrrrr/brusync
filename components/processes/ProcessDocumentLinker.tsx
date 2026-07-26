"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { searchKnowledgeAction } from "@/application/knowledge/knowledgeSearchQueries";
import {
  attachProcessDocumentAction,
  detachProcessDocumentAction,
} from "@/application/processes/processesAttachmentsActions";
import { IconTrash } from "@/components/ui/icons";
import type { KnowledgeSearchResult } from "@/types/knowledge";
import type { ProcessDocumentLink } from "@/types/processes";

/** Busca reaproveita searchKnowledgeAction (Fase 18) diretamente — nenhuma
 * query nova de busca em documentos, só a junção crm_process_documents que
 * aponta para o resultado escolhido. */
export function ProcessDocumentLinker({
  processId,
  documents,
}: {
  processId: string;
  documents: ProcessDocumentLink[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<KnowledgeSearchResult[]>([]);
  const [searching, startSearch] = useTransition();

  function handleSearch(value: string) {
    setQuery(value);
    if (!value.trim()) {
      setResults([]);
      return;
    }
    startSearch(async () => {
      const found = await searchKnowledgeAction(value);
      setResults(found);
    });
  }

  function handleAttach(doc: KnowledgeSearchResult) {
    startTransition(async () => {
      await attachProcessDocumentAction(processId, doc.id, doc.title);
      setQuery("");
      setResults([]);
      router.refresh();
    });
  }

  function handleDetach(documentId: string) {
    startTransition(async () => {
      await detachProcessDocumentAction(processId, documentId);
      router.refresh();
    });
  }

  const linkedIds = new Set(documents.map((d) => d.documentId));

  return (
    <div className="crm-card crm-card-pad">
      <div className="crm-card-title">Documentos e Base de Conhecimento</div>
      <div className="crm-mini-list" style={{ marginTop: 8 }}>
        {documents.map((doc) => (
          <div key={doc.documentId} className="crm-mini-row">
            <span className="crm-mini-ico">•</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="crm-mini-title">{doc.documentTitle}</div>
              {doc.documentCategoryName && (
                <div className="crm-card-sub">{doc.documentCategoryName}</div>
              )}
            </div>
            <button
              type="button"
              className="btn btn-outline"
              disabled={isPending}
              onClick={() => handleDetach(doc.documentId)}
              aria-label="Desvincular"
            >
              <IconTrash size={13} />
            </button>
          </div>
        ))}
        {documents.length === 0 && (
          <p className="crm-card-sub">Nenhum documento vinculado ainda.</p>
        )}
      </div>

      <div className="crm-field" style={{ marginTop: 12 }}>
        <label htmlFor="proc-doc-search">Vincular documento da Base de Conhecimento</label>
        <input
          id="proc-doc-search"
          placeholder="Buscar por título…"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>
      {searching && <p className="crm-card-sub">Buscando…</p>}
      {results.length > 0 && (
        <div className="crm-mini-list">
          {results
            .filter((result) => !linkedIds.has(result.id))
            .map((result) => (
              <button
                key={result.id}
                type="button"
                className="crm-mini-row"
                disabled={isPending}
                onClick={() => handleAttach(result)}
              >
                <span className="crm-mini-ico">•</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="crm-mini-title">{result.title}</div>
                  {result.categoryName && <div className="crm-card-sub">{result.categoryName}</div>}
                </div>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
