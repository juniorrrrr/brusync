"use client";

import { useRef, useTransition } from "react";
import { uploadKnowledgeFileAction } from "@/application/knowledge/knowledgeFilesActions";
import {
  IconAlertTriangle,
  IconCheckSquare,
  IconCode,
  IconImage,
  IconLink2,
  IconPaperclip,
  IconTable,
  IconTrash,
  IconType,
  IconVideo,
} from "@/components/ui/icons";
import type {
  KnowledgeAlertData,
  KnowledgeAttachmentData,
  KnowledgeBlockType,
  KnowledgeChecklistData,
  KnowledgeCodeData,
  KnowledgeImageData,
  KnowledgeLinkData,
  KnowledgeListData,
  KnowledgeParagraphData,
  KnowledgeTableData,
  KnowledgeVideoData,
} from "@/domain/knowledge/blocks";
import { createEmptyBlock, KNOWLEDGE_BLOCK_LABEL } from "@/domain/knowledge/blocks";
import type { KnowledgeBlock } from "@/types/knowledge";

const TOOLBAR_ITEMS: { type: KnowledgeBlockType; icon: typeof IconType }[] = [
  { type: "heading", icon: IconType },
  { type: "subheading", icon: IconType },
  { type: "paragraph", icon: IconType },
  { type: "list", icon: IconCheckSquare },
  { type: "checklist", icon: IconCheckSquare },
  { type: "table", icon: IconTable },
  { type: "code", icon: IconCode },
  { type: "alert", icon: IconAlertTriangle },
  { type: "image", icon: IconImage },
  { type: "video", icon: IconVideo },
  { type: "attachment", icon: IconPaperclip },
  { type: "link", icon: IconLink2 },
];

export function KnowledgeBlockEditor({
  blocks,
  onChange,
  documentId,
}: {
  blocks: KnowledgeBlock[];
  onChange: (blocks: KnowledgeBlock[]) => void;
  documentId: string | null;
}) {
  function updateBlock(id: string, data: Record<string, unknown>) {
    onChange(blocks.map((b) => (b.id === id ? { ...b, data } : b)));
  }
  function removeBlock(id: string) {
    onChange(blocks.filter((b) => b.id !== id));
  }
  function moveBlock(id: string, direction: -1 | 1) {
    const index = blocks.findIndex((b) => b.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }
  function addBlock(type: KnowledgeBlockType) {
    onChange([...blocks, createEmptyBlock(type)]);
  }

  return (
    <div>
      <div className="crm-kb-block-toolbar">
        {TOOLBAR_ITEMS.map(({ type, icon: Icon }) => (
          <button
            key={type}
            type="button"
            className="crm-kb-block-btn"
            onClick={() => addBlock(type)}
          >
            <Icon size={14} />
            {KNOWLEDGE_BLOCK_LABEL[type]}
          </button>
        ))}
      </div>

      <div className="crm-kb-editor-canvas">
        {blocks.length === 0 && (
          <p className="crm-card-sub">
            Use a barra acima para adicionar o primeiro bloco de conteúdo.
          </p>
        )}
        {blocks.map((b, index) => (
          <div key={b.id} className="crm-kb-block">
            <div className="crm-kb-block-actions">
              <button
                type="button"
                className="crm-icon-btn"
                onClick={() => moveBlock(b.id, -1)}
                disabled={index === 0}
                aria-label="Mover para cima"
              >
                ↑
              </button>
              <button
                type="button"
                className="crm-icon-btn"
                onClick={() => moveBlock(b.id, 1)}
                disabled={index === blocks.length - 1}
                aria-label="Mover para baixo"
              >
                ↓
              </button>
              <button
                type="button"
                className="crm-icon-btn"
                onClick={() => removeBlock(b.id)}
                aria-label="Remover bloco"
              >
                <IconTrash size={14} />
              </button>
            </div>
            <BlockEditor
              block={b}
              documentId={documentId}
              onChange={(data) => updateBlock(b.id, data)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function BlockEditor({
  block: b,
  documentId,
  onChange,
}: {
  block: KnowledgeBlock;
  documentId: string | null;
  onChange: (data: Record<string, unknown>) => void;
}) {
  switch (b.type) {
    case "heading":
    case "subheading": {
      const data = b.data as unknown as KnowledgeParagraphData;
      return (
        <input
          className={`crm-kb-block-input crm-kb-block-${b.type}`}
          placeholder={KNOWLEDGE_BLOCK_LABEL[b.type]}
          value={data.text}
          onChange={(e) => onChange({ text: e.target.value })}
        />
      );
    }
    case "paragraph": {
      const data = b.data as unknown as KnowledgeParagraphData;
      return (
        <textarea
          className="crm-kb-block-input crm-kb-block-paragraph"
          placeholder="Escreva o texto…"
          value={data.text}
          rows={3}
          onChange={(e) => onChange({ text: e.target.value })}
        />
      );
    }
    case "list": {
      const data = b.data as unknown as KnowledgeListData;
      return (
        <div>
          <label
            style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12, marginBottom: 6 }}
          >
            <input
              type="checkbox"
              checked={data.ordered}
              onChange={(e) => onChange({ ...data, ordered: e.target.checked })}
            />
            Lista numerada
          </label>
          {data.items.map((item, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: list items are plain strings with no stable id, and only ever appended/removed within this single block's own state
            <div key={`item-${i}`} style={{ display: "flex", gap: 6, marginBottom: 4 }}>
              <input
                className="crm-kb-block-input"
                value={item}
                onChange={(e) => {
                  const items = [...data.items];
                  items[i] = e.target.value;
                  onChange({ ...data, items });
                }}
              />
              <button
                type="button"
                className="crm-icon-btn"
                onClick={() =>
                  onChange({ ...data, items: data.items.filter((_, idx) => idx !== i) })
                }
              >
                <IconTrash size={13} />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="crm-kb-block-btn"
            onClick={() => onChange({ ...data, items: [...data.items, ""] })}
          >
            + item
          </button>
        </div>
      );
    }
    case "checklist": {
      const data = b.data as unknown as KnowledgeChecklistData;
      return (
        <div>
          {data.items.map((item, i) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: checklist items have no stable id, and only ever appended/removed within this single block's own state
              key={`chk-${i}`}
              style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}
            >
              <input
                type="checkbox"
                checked={item.done}
                onChange={(e) => {
                  const items = [...data.items];
                  items[i] = { ...item, done: e.target.checked };
                  onChange({ items });
                }}
              />
              <input
                className="crm-kb-block-input"
                value={item.text}
                onChange={(e) => {
                  const items = [...data.items];
                  items[i] = { ...item, text: e.target.value };
                  onChange({ items });
                }}
              />
              <button
                type="button"
                className="crm-icon-btn"
                onClick={() => onChange({ items: data.items.filter((_, idx) => idx !== i) })}
              >
                <IconTrash size={13} />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="crm-kb-block-btn"
            onClick={() => onChange({ items: [...data.items, { text: "", done: false }] })}
          >
            + item
          </button>
        </div>
      );
    }
    case "table": {
      const data = b.data as unknown as KnowledgeTableData;
      return (
        <div className="crm-kb-table-wrap">
          <table className="crm-kb-table">
            <thead>
              <tr>
                {data.headers.map((h, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: table columns have no stable id, position is the identity here
                  <th key={`h-${i}`}>
                    <input
                      className="crm-kb-block-input"
                      value={h}
                      onChange={(e) => {
                        const headers = [...data.headers];
                        headers[i] = e.target.value;
                        onChange({ ...data, headers });
                      }}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, ri) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: table rows have no stable id, position is the identity here
                <tr key={`r-${ri}`}>
                  {row.map((cell, ci) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: table cells have no stable id, position is the identity here
                    <td key={`c-${ri}-${ci}`}>
                      <input
                        className="crm-kb-block-input"
                        value={cell}
                        onChange={(e) => {
                          const rows = data.rows.map((r) => [...r]);
                          rows[ri][ci] = e.target.value;
                          onChange({ ...data, rows });
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <button
              type="button"
              className="crm-kb-block-btn"
              onClick={() =>
                onChange({
                  ...data,
                  headers: [...data.headers, `Coluna ${data.headers.length + 1}`],
                  rows: data.rows.map((r) => [...r, ""]),
                })
              }
            >
              + coluna
            </button>
            <button
              type="button"
              className="crm-kb-block-btn"
              onClick={() =>
                onChange({ ...data, rows: [...data.rows, data.headers.map(() => "")] })
              }
            >
              + linha
            </button>
          </div>
        </div>
      );
    }
    case "code": {
      const data = b.data as unknown as KnowledgeCodeData;
      return (
        <div>
          <input
            className="crm-kb-block-input"
            placeholder="linguagem (ex: sql, javascript)"
            value={data.language}
            style={{ marginBottom: 6, fontSize: 12 }}
            onChange={(e) => onChange({ ...data, language: e.target.value })}
          />
          <textarea
            className="crm-kb-code-block"
            style={{ width: "100%", border: "none", outline: "none" }}
            rows={6}
            value={data.code}
            onChange={(e) => onChange({ ...data, code: e.target.value })}
          />
        </div>
      );
    }
    case "alert": {
      const data = b.data as unknown as KnowledgeAlertData;
      return (
        <div className={`crm-kb-alert ${data.tone}`}>
          <select
            value={data.tone}
            onChange={(e) => onChange({ ...data, tone: e.target.value })}
            style={{ border: "none", background: "transparent", fontWeight: 700 }}
          >
            <option value="info">Info</option>
            <option value="warn">Atenção</option>
            <option value="ok">Sucesso</option>
            <option value="danger">Perigo</option>
          </select>
          <textarea
            className="crm-kb-block-input"
            rows={2}
            value={data.text}
            placeholder="Texto do alerta…"
            onChange={(e) => onChange({ ...data, text: e.target.value })}
          />
        </div>
      );
    }
    case "image":
      return (
        <ImageBlockEditor
          data={b.data as unknown as KnowledgeImageData}
          documentId={documentId}
          onChange={onChange}
        />
      );
    case "video": {
      const data = b.data as unknown as KnowledgeVideoData;
      return (
        <div>
          <input
            className="crm-kb-block-input"
            placeholder="URL do vídeo (YouTube, Vimeo…)"
            value={data.url}
            onChange={(e) => onChange({ ...data, url: e.target.value })}
          />
          <input
            className="crm-kb-block-input"
            placeholder="Legenda (opcional)"
            value={data.caption}
            style={{ marginTop: 4, fontSize: 12 }}
            onChange={(e) => onChange({ ...data, caption: e.target.value })}
          />
        </div>
      );
    }
    case "attachment":
      return (
        <AttachmentBlockEditor
          data={b.data as unknown as KnowledgeAttachmentData}
          documentId={documentId}
          onChange={onChange}
        />
      );
    case "link": {
      const data = b.data as unknown as KnowledgeLinkData;
      return (
        <div style={{ display: "flex", gap: 6 }}>
          <input
            className="crm-kb-block-input"
            placeholder="URL"
            value={data.url}
            onChange={(e) => onChange({ ...data, url: e.target.value })}
          />
          <input
            className="crm-kb-block-input"
            placeholder="Texto do link"
            value={data.label}
            onChange={(e) => onChange({ ...data, label: e.target.value })}
          />
        </div>
      );
    }
    default:
      return null;
  }
}

function ImageBlockEditor({
  data,
  documentId,
  onChange,
}: {
  data: KnowledgeImageData;
  documentId: string | null;
  onChange: (data: Record<string, unknown>) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  function handleUpload(file: File) {
    if (!documentId) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.append("documentId", documentId);
      formData.append("file", file);
      const result = await uploadKnowledgeFileAction({ status: "idle" }, formData);
      if (result.status === "success" && result.file) {
        onChange({ fileId: result.file.id, url: "", caption: data.caption || file.name });
      }
    });
  }

  return (
    <div>
      {data.url && (
        // biome-ignore lint/performance/noImgElement: editor preview of an arbitrary external URL, not an optimizable local asset
        <img
          src={data.url}
          alt={data.caption}
          style={{ maxWidth: "100%", borderRadius: 8, marginBottom: 6 }}
        />
      )}
      <input
        className="crm-kb-block-input"
        placeholder="URL da imagem (ou envie um arquivo abaixo)"
        value={data.url}
        onChange={(e) => onChange({ ...data, url: e.target.value })}
      />
      <input
        className="crm-kb-block-input"
        placeholder="Legenda"
        value={data.caption}
        style={{ marginTop: 4, fontSize: 12 }}
        onChange={(e) => onChange({ ...data, caption: e.target.value })}
      />
      <div style={{ marginTop: 6 }}>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
          }}
        />
        <button
          type="button"
          className="crm-kb-block-btn"
          disabled={!documentId || isPending}
          onClick={() => inputRef.current?.click()}
          title={documentId ? undefined : "Salve o documento para enviar imagens"}
        >
          {isPending ? "Enviando…" : "Enviar imagem"}
        </button>
      </div>
    </div>
  );
}

function AttachmentBlockEditor({
  data,
  documentId,
  onChange,
}: {
  data: KnowledgeAttachmentData;
  documentId: string | null;
  onChange: (data: Record<string, unknown>) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  function handleUpload(file: File) {
    if (!documentId) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.append("documentId", documentId);
      formData.append("file", file);
      const result = await uploadKnowledgeFileAction({ status: "idle" }, formData);
      if (result.status === "success" && result.file)
        onChange({ fileId: result.file.id, fileName: file.name });
    });
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <IconPaperclip size={16} />
      <span style={{ fontSize: 13 }}>{data.fileName || "Nenhum arquivo anexado"}</span>
      <input
        ref={inputRef}
        type="file"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
        }}
      />
      <button
        type="button"
        className="crm-kb-block-btn"
        disabled={!documentId || isPending}
        onClick={() => inputRef.current?.click()}
        title={documentId ? undefined : "Salve o documento para anexar arquivos"}
      >
        {isPending ? "Enviando…" : "Anexar arquivo"}
      </button>
    </div>
  );
}
