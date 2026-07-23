"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { searchClientsAction } from "@/application/projects/projectsActions";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { initials } from "@/domain/crm/format";
import type { ClientWithOwner } from "@/types/crm";

/** Inline client search/select for the project creation form — same
 * Command primitive pattern as components/agenda/LeadPicker.tsx. */
export function ClientPicker({
  name,
  defaultClientId,
  defaultClientCompany,
}: {
  name: string;
  defaultClientId?: string | null;
  defaultClientCompany?: string | null;
}) {
  const [selectedId, setSelectedId] = useState(defaultClientId ?? "");
  const [query, setQuery] = useState(defaultClientCompany ?? "");
  const [results, setResults] = useState<ClientWithOwner[]>([]);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      startTransition(async () => setResults(await searchClientsAction(query)));
    }, 200);
    return () => clearTimeout(timeout);
  }, [query]);

  function handleSelect(client: ClientWithOwner) {
    setSelectedId(client.id);
    setQuery(client.company);
    setResults([]);
    setOpen(false);
  }

  return (
    <div className="crm-field" ref={containerRef} style={{ position: "relative" }}>
      <label htmlFor="project-client-picker">Cliente *</label>
      <input type="hidden" name={name} value={selectedId} />
      <Command shouldFilter={false} style={{ overflow: "visible" }}>
        <CommandInput
          id="project-client-picker"
          placeholder="Buscar cliente por empresa, contato ou e-mail…"
          value={query}
          onValueChange={(value) => {
            setQuery(value);
            setSelectedId("");
          }}
          onFocus={() => setOpen(true)}
        />
        {open && query.trim() && (
          <CommandList
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              zIndex: 30,
              marginTop: 4,
              background: "#fff",
              border: "1px solid var(--border)",
              borderRadius: 10,
              boxShadow: "var(--shadow-md)",
            }}
          >
            {!isPending && results.length === 0 && (
              <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
            )}
            {results.length > 0 && (
              <CommandGroup heading="Clientes">
                {results.map((client) => (
                  <CommandItem
                    key={client.id}
                    value={client.id}
                    onSelect={() => handleSelect(client)}
                  >
                    <span className="crm-avatar" style={{ width: 22, height: 22, fontSize: 10 }}>
                      {initials(client.company)}
                    </span>
                    <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{client.company}</span>
                      <span className="cell-muted" style={{ fontSize: 11 }}>
                        {client.name || "Sem contato principal"}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        )}
      </Command>
    </div>
  );
}
