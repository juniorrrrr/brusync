"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { KnowledgeStatusBadge } from "@/components/knowledge/KnowledgeStatusBadge";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { IconSearch } from "@/components/ui/icons";
import { KNOWLEDGE_CONTENT_TYPE_LABEL } from "@/domain/knowledge/types";
import { useKnowledgeSearch } from "@/hooks/knowledge/useKnowledgeSearch";

const MATCH_LABEL: Record<string, string> = {
  titulo: "título",
  conteudo: "conteúdo",
  categoria: "categoria",
  tag: "tag",
  autor: "autor",
  cliente: "cliente",
  projeto: "projeto",
  lead: "lead",
  arquivo: "arquivo",
};

export function KnowledgeGlobalSearch() {
  const [open, setOpen] = useState(false);
  const { query, setQuery, results, isPending } = useKnowledgeSearch();
  const router = useRouter();

  function handleSelect(id: string) {
    setOpen(false);
    router.push(`/base-conhecimento/documentos/${id}`);
  }

  return (
    <>
      <button type="button" className="crm-cmdk-trigger" onClick={() => setOpen(true)}>
        <IconSearch size={15} />
        <span>Buscar na Base de Conhecimento…</span>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Buscar por título, conteúdo, categoria, tag, autor, cliente, projeto, lead ou arquivo…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList className="crm-kb-search-results">
          {query.trim() && !isPending && results.length === 0 && (
            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          )}
          {!query.trim() && (
            <div
              className="cell-muted"
              style={{ padding: "28px 12px", textAlign: "center", fontSize: 13 }}
            >
              Digite para buscar documentos, playbooks, procedimentos e mais.
            </div>
          )}
          {results.length > 0 && (
            <CommandGroup heading="Documentos">
              {results.map((result) => (
                <CommandItem
                  key={result.id}
                  value={result.id}
                  onSelect={() => handleSelect(result.id)}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      flex: 1,
                      minWidth: 0,
                      gap: 2,
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{result.title}</span>
                    <span className="cell-muted" style={{ fontSize: 11.5 }}>
                      {KNOWLEDGE_CONTENT_TYPE_LABEL[result.contentType]}
                      {result.categoryName ? ` · ${result.categoryName}` : ""}
                      {" · encontrado em "}
                      {result.matchedIn.map((m) => MATCH_LABEL[m] ?? m).join(", ")}
                    </span>
                  </div>
                  <KnowledgeStatusBadge status={result.status} />
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
