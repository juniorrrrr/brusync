"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { IconSearch, IconStar } from "@/components/ui/icons";
import { useOperationsFavorite } from "@/hooks/operations/useOperationsFavorite";
import { useOperationsSearch } from "@/hooks/operations/useOperationsSearch";
import type {
  OperationsFavoriteEntityType,
  OperationsSearchEntityType,
  OperationsSearchResult,
} from "@/types/operations";

const ENTITY_LABEL: Record<OperationsSearchEntityType, string> = {
  lead: "Lead",
  client: "Cliente",
  project: "Projeto",
  document: "Conhecimento",
  message: "Mensagem",
  financial: "Financeiro",
  agenda: "Agenda",
  automation: "Automação",
  integration: "Integração",
};

type FavoritableSearchEntityType = "lead" | "client" | "project" | "document" | "integration";
const FAVORITABLE_TYPES: FavoritableSearchEntityType[] = [
  "lead",
  "client",
  "project",
  "document",
  "integration",
];

function isFavoritableType(
  entityType: OperationsSearchEntityType,
): entityType is FavoritableSearchEntityType {
  return (FAVORITABLE_TYPES as string[]).includes(entityType);
}

function SearchResultFavoriteButton({ result }: { result: OperationsSearchResult }) {
  const { favorite, toggle, isPending } = useOperationsFavorite({
    entityType: result.entityType as OperationsFavoriteEntityType,
    entityId: result.id,
    label: result.title,
    href: result.href,
    initialFavorite: false,
  });

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        toggle();
      }}
      disabled={isPending}
      aria-label={favorite ? "Remover dos favoritos" : "Favoritar"}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        display: "flex",
        color: favorite ? "#e8a33d" : "var(--muted)",
      }}
    >
      <IconStar size={14} />
    </button>
  );
}

export function OperationsGlobalSearch() {
  const [open, setOpen] = useState(false);
  const { query, setQuery, results, isPending } = useOperationsSearch();
  const router = useRouter();

  function handleSelect(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <>
      <button type="button" className="crm-cmdk-trigger" onClick={() => setOpen(true)}>
        <IconSearch size={15} />
        <span>Buscar em tudo — leads, clientes, projetos, financeiro, agenda…</span>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Lead, Cliente, Projeto, Documento, Mensagem, Financeiro, Agenda, Automação, Integração…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {query.trim() && !isPending && results.length === 0 && (
            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          )}
          {!query.trim() && (
            <div
              className="cell-muted"
              style={{ padding: "28px 12px", textAlign: "center", fontSize: 13 }}
            >
              Digite para buscar em todos os módulos do Brusync.
            </div>
          )}
          {results.length > 0 && (
            <CommandGroup heading="Resultados">
              {results.map((result) => (
                <CommandItem
                  key={`${result.entityType}-${result.id}`}
                  value={`${result.entityType}-${result.id}`}
                  onSelect={() => handleSelect(result.href)}
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
                      {ENTITY_LABEL[result.entityType]}
                      {result.subtitle ? ` · ${result.subtitle}` : ""}
                    </span>
                  </div>
                  {isFavoritableType(result.entityType) && (
                    <SearchResultFavoriteButton result={result} />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
