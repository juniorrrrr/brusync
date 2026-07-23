"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { searchLeadsAction } from "@/application/crm/leadsActions";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { initials } from "@/domain/crm/format";
import type { CrmLeadWithRelations } from "@/types/crm";

/** Inline lead search/select for the Agenda event form — same Command
 * primitive (cmdk + Radix) GlobalSearch.tsx uses for Cmd/Ctrl+K, just
 * embedded in the form instead of a modal overlay. */
export function LeadPicker({
  name,
  defaultLeadId,
  defaultLeadName,
}: {
  name: string;
  defaultLeadId?: string | null;
  defaultLeadName?: string | null;
}) {
  const [selectedId, setSelectedId] = useState(defaultLeadId ?? "");
  const [query, setQuery] = useState(defaultLeadName ?? "");
  const [results, setResults] = useState<CrmLeadWithRelations[]>([]);
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
      startTransition(async () => setResults(await searchLeadsAction(query)));
    }, 200);
    return () => clearTimeout(timeout);
  }, [query]);

  function handleSelect(lead: CrmLeadWithRelations) {
    setSelectedId(lead.id);
    setQuery(lead.name);
    setResults([]);
    setOpen(false);
  }

  return (
    <div className="crm-field" ref={containerRef} style={{ position: "relative" }}>
      <label htmlFor="agenda-lead-picker">Lead vinculado</label>
      <input type="hidden" name={name} value={selectedId} />
      <Command shouldFilter={false} style={{ overflow: "visible" }}>
        <CommandInput
          id="agenda-lead-picker"
          placeholder="Buscar lead por nome, empresa ou e-mail…"
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
              <CommandEmpty>Nenhum lead encontrado.</CommandEmpty>
            )}
            {results.length > 0 && (
              <CommandGroup heading="Leads">
                {results.map((lead) => (
                  <CommandItem key={lead.id} value={lead.id} onSelect={() => handleSelect(lead)}>
                    <span className="crm-avatar" style={{ width: 22, height: 22, fontSize: 10 }}>
                      {initials(lead.name)}
                    </span>
                    <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{lead.name}</span>
                      <span className="cell-muted" style={{ fontSize: 11 }}>
                        {lead.company || "Sem empresa"}
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
