"use client";

import { useEffect, useState, useTransition } from "react";
import { searchLeadsAction } from "@/application/crm/leadsActions";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useLeadDrawer } from "@/contexts/crm/LeadDrawerContext";
import { initials } from "@/domain/crm/format";
import type { CrmLeadWithRelations } from "@/types/crm";

/** Global Cmd/Ctrl+K search (nome, empresa, telefone, e-mail, cidade, tags),
 * mounted once at the CRM shell so the shortcut works from any screen. */
export function GlobalSearch({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CrmLeadWithRelations[]>([]);
  const [isPending, startTransition] = useTransition();
  const { openLead } = useLeadDrawer();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      startTransition(async () => {
        const found = await searchLeadsAction(query);
        setResults(found);
      });
    }, 200);
    return () => clearTimeout(timeout);
  }, [query]);

  function handleSelect(leadId: string) {
    onOpenChange(false);
    openLead(leadId);
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Buscar por nome, empresa, telefone, e-mail, cidade ou tag..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {query.trim() && !isPending && results.length === 0 && (
          <CommandEmpty>Nenhum lead encontrado.</CommandEmpty>
        )}
        {!query.trim() && (
          <div
            className="cell-muted"
            style={{ padding: "28px 12px", textAlign: "center", fontSize: 13 }}
          >
            Digite para buscar leads por nome, empresa, telefone, e-mail, cidade ou tag.
          </div>
        )}
        {results.length > 0 && (
          <CommandGroup heading="Leads">
            {results.map((lead) => (
              <CommandItem key={lead.id} value={lead.id} onSelect={() => handleSelect(lead.id)}>
                <span className="crm-avatar" style={{ width: 24, height: 24, fontSize: 10 }}>
                  {initials(lead.name)}
                </span>
                <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{lead.name}</span>
                  <span className="cell-muted" style={{ fontSize: 11.5 }}>
                    {lead.company || "Sem empresa"}
                    {lead.city ? ` · ${lead.city}` : ""}
                  </span>
                </div>
                <span className={`crm-badge ${lead.stage.color}`} style={{ fontSize: 10 }}>
                  {lead.stage.label}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
