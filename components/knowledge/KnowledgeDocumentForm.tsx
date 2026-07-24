"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { searchLeadsAction } from "@/application/crm/leadsActions";
import {
  createKnowledgeDocumentAction,
  updateKnowledgeDocumentAction,
} from "@/application/knowledge/knowledgeDocumentsActions";
import { fetchProjectsForClient } from "@/application/projects/projectsActions";
import { KnowledgeBlockEditor } from "@/components/knowledge/KnowledgeBlockEditor";
import { ClientPicker } from "@/components/projects/ClientPicker";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { KNOWLEDGE_CONTENT_TYPE_LABEL, KNOWLEDGE_CONTENT_TYPES } from "@/domain/knowledge/types";
import type { ClientWithOwner } from "@/types/crm";
import type {
  KnowledgeCategory,
  KnowledgeContentType,
  KnowledgeDocumentDetail,
} from "@/types/knowledge";
import type { Project } from "@/types/projects";

export function KnowledgeDocumentForm({
  categories,
  initialDocument,
  defaultContentType,
  defaultTitle,
  initialBlocks,
}: {
  categories: KnowledgeCategory[];
  initialDocument?: KnowledgeDocumentDetail;
  defaultContentType?: KnowledgeContentType;
  defaultTitle?: string;
  initialBlocks?: KnowledgeDocumentDetail["contentJson"];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(initialDocument?.title ?? defaultTitle ?? "");
  const [categoryId, setCategoryId] = useState(
    initialDocument?.categoryId ?? categories[0]?.id ?? "",
  );
  const [contentType, setContentType] = useState<KnowledgeContentType>(
    initialDocument?.contentType ?? defaultContentType ?? "documento",
  );
  const [summary, setSummary] = useState(initialDocument?.summary ?? "");
  const [externalUrl, setExternalUrl] = useState(initialDocument?.externalUrl ?? "");
  const [tagsText, setTagsText] = useState(
    initialDocument?.tags.map((t) => t.name).join(", ") ?? "",
  );
  const [blocks, setBlocks] = useState(initialDocument?.contentJson ?? initialBlocks ?? []);
  const [changeNote, setChangeNote] = useState("");

  const [clientId, setClientId] = useState(initialDocument?.clientId ?? null);
  const [clientCompany, setClientCompany] = useState(initialDocument?.clientCompany ?? null);
  const [projectId, setProjectId] = useState(initialDocument?.projectId ?? "");
  const [projects, setProjects] = useState<Project[]>([]);
  const [crmLeadId, setCrmLeadId] = useState(initialDocument?.crmLeadId ?? null);
  const [crmLeadName, setCrmLeadName] = useState(initialDocument?.crmLeadName ?? null);

  useEffect(() => {
    if (!clientId) {
      setProjects([]);
      return;
    }
    fetchProjectsForClient(clientId).then(setProjects);
  }, [clientId]);

  function handleSave() {
    if (!title.trim()) {
      setError("Informe um título.");
      return;
    }
    setError(null);

    const input = {
      categoryId: categoryId || null,
      title: title.trim(),
      contentType,
      contentJson: blocks,
      summary: summary.trim() || null,
      externalUrl: contentType === "link_externo" ? externalUrl.trim() || null : null,
      tagNames: tagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      clientId,
      projectId: projectId || null,
      crmLeadId,
      conversationId: initialDocument?.conversationId ?? null,
      automationId: initialDocument?.automationId ?? null,
      integrationId: initialDocument?.integrationId ?? null,
      financialTransactionId: initialDocument?.financialTransactionId ?? null,
    };

    startTransition(async () => {
      const result = initialDocument
        ? await updateKnowledgeDocumentAction(initialDocument.id, input, changeNote.trim() || null)
        : await createKnowledgeDocumentAction(input);

      if (result.status === "error") {
        setError(result.message ?? "Falha ao salvar documento.");
        return;
      }
      router.push(`/base-conhecimento/documentos/${result.documentId}`);
    });
  }

  return (
    <div>
      <div className="crm-card crm-card-pad" style={{ marginBottom: 16 }}>
        <div className="crm-field">
          <label htmlFor="kb-title">Título *</label>
          <input id="kb-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        <div className="crm-composer-row" style={{ marginTop: 10 }}>
          <div className="crm-field">
            <label htmlFor="kb-category">Categoria</label>
            <select
              id="kb-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Sem categoria</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="crm-field">
            <label htmlFor="kb-type">Tipo de conteúdo</label>
            <select
              id="kb-type"
              value={contentType}
              onChange={(e) => setContentType(e.target.value as KnowledgeContentType)}
            >
              {KNOWLEDGE_CONTENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {KNOWLEDGE_CONTENT_TYPE_LABEL[type]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {contentType === "link_externo" && (
          <div className="crm-field" style={{ marginTop: 10 }}>
            <label htmlFor="kb-url">URL externa</label>
            <input
              id="kb-url"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
            />
          </div>
        )}

        <div className="crm-field" style={{ marginTop: 10 }}>
          <label htmlFor="kb-summary">Resumo</label>
          <textarea
            id="kb-summary"
            rows={2}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
        </div>

        <div className="crm-field" style={{ marginTop: 10 }}>
          <label htmlFor="kb-tags">Tags (separadas por vírgula)</label>
          <input id="kb-tags" value={tagsText} onChange={(e) => setTagsText(e.target.value)} />
        </div>

        <div className="crm-composer-row" style={{ marginTop: 10 }}>
          <div className="crm-field">
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>
              Cliente vinculado
            </span>
            <ClientPicker
              name="clientId"
              defaultClientId={clientId ?? undefined}
              defaultClientCompany={clientCompany ?? undefined}
              onSelectClient={(client: ClientWithOwner) => {
                setClientId(client.id);
                setClientCompany(client.company);
              }}
            />
          </div>
          <div className="crm-field">
            <label htmlFor="kb-project">Projeto vinculado</label>
            <select
              id="kb-project"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            >
              <option value="">Sem projeto</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="crm-field" style={{ marginTop: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>
            Lead vinculado
          </span>
          <InlineLeadSearch
            defaultName={crmLeadName}
            onSelect={(id, name) => {
              setCrmLeadId(id);
              setCrmLeadName(name);
            }}
          />
        </div>

        {initialDocument && (
          <div className="crm-field" style={{ marginTop: 10 }}>
            <label htmlFor="kb-change-note">Nota da alteração (opcional)</label>
            <input
              id="kb-change-note"
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
              placeholder="Ex: correção de valores da proposta"
            />
          </div>
        )}
      </div>

      <div className="crm-card crm-card-pad">
        <div className="crm-card-head">
          <div className="crm-card-title">Conteúdo</div>
        </div>
        <KnowledgeBlockEditor
          blocks={blocks}
          onChange={setBlocks}
          documentId={initialDocument?.id ?? null}
        />
      </div>

      {error && (
        <div className="crm-field-error" style={{ marginTop: 12 }}>
          {error}
        </div>
      )}

      <div className="crm-modal-actions" style={{ marginTop: 16, justifyContent: "flex-end" }}>
        <button type="button" className="btn btn-outline" onClick={() => router.back()}>
          Cancelar
        </button>
        <button type="button" className="btn btn-accent" onClick={handleSave} disabled={isPending}>
          {isPending ? "Salvando…" : initialDocument ? "Salvar alterações" : "Criar documento"}
        </button>
      </div>
    </div>
  );
}

function InlineLeadSearch({
  defaultName,
  onSelect,
}: {
  defaultName: string | null;
  onSelect: (id: string | null, name: string | null) => void;
}) {
  const [query, setQuery] = useState(defaultName ?? "");
  const [results, setResults] = useState<{ id: string; name: string; company: string | null }[]>(
    [],
  );
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      const found = await searchLeadsAction(query);
      setResults(found.map((l) => ({ id: l.id, name: l.name, company: l.company })));
    }, 200);
    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (!e.target.value.trim()) onSelect(null, null);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Buscar lead por nome…"
      />
      {open && query.trim() && (
        <div
          className="crm-modal"
          style={{ position: "absolute", zIndex: 10, width: "100%", marginTop: 4 }}
        >
          <Command>
            <CommandList>
              {results.length === 0 && <CommandEmpty>Nenhum lead encontrado.</CommandEmpty>}
              <CommandGroup>
                {results.map((lead) => (
                  <CommandItem
                    key={lead.id}
                    value={lead.id}
                    onSelect={() => {
                      setQuery(lead.name);
                      onSelect(lead.id, lead.name);
                      setOpen(false);
                    }}
                  >
                    {lead.name} {lead.company ? `— ${lead.company}` : ""}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}
