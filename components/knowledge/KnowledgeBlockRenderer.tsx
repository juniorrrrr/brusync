"use client";

import { useEffect, useState } from "react";
import { getKnowledgeFileDownloadUrlAction } from "@/application/knowledge/knowledgeFilesActions";
import { IconLink2, IconPaperclip } from "@/components/ui/icons";
import type {
  KnowledgeAlertData,
  KnowledgeAttachmentData,
  KnowledgeChecklistData,
  KnowledgeCodeData,
  KnowledgeImageData,
  KnowledgeLinkData,
  KnowledgeListData,
  KnowledgeParagraphData,
  KnowledgeTableData,
  KnowledgeVideoData,
} from "@/domain/knowledge/blocks";
import type { KnowledgeBlock } from "@/types/knowledge";

export function KnowledgeBlockRenderer({ blocks }: { blocks: KnowledgeBlock[] }) {
  if (blocks.length === 0) {
    return <p className="crm-card-sub">Este documento ainda não tem conteúdo.</p>;
  }
  return (
    <div className="crm-kb-editor-canvas">
      {blocks.map((b) => (
        <BlockView key={b.id} block={b} />
      ))}
    </div>
  );
}

function BlockView({ block: b }: { block: KnowledgeBlock }) {
  switch (b.type) {
    case "heading": {
      const data = b.data as unknown as KnowledgeParagraphData;
      return <h2 className="crm-kb-block-heading">{data.text}</h2>;
    }
    case "subheading": {
      const data = b.data as unknown as KnowledgeParagraphData;
      return <h3 className="crm-kb-block-subheading">{data.text}</h3>;
    }
    case "paragraph": {
      const data = b.data as unknown as KnowledgeParagraphData;
      return <p className="crm-kb-block-paragraph">{data.text}</p>;
    }
    case "list": {
      const data = b.data as unknown as KnowledgeListData;
      const Tag = data.ordered ? "ol" : "ul";
      return (
        <Tag style={{ paddingLeft: 22, fontSize: 14, lineHeight: 1.7 }}>
          {data.items.map((item, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: list items have no stable id, position is the identity here
            <li key={`li-${i}`}>{item}</li>
          ))}
        </Tag>
      );
    }
    case "checklist": {
      const data = b.data as unknown as KnowledgeChecklistData;
      return (
        <div>
          {data.items.map((item, i) => (
            <label
              // biome-ignore lint/suspicious/noArrayIndexKey: checklist items have no stable id, position is the identity here
              key={`cl-${i}`}
              style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}
            >
              <input type="checkbox" checked={item.done} readOnly />
              <span style={{ textDecoration: item.done ? "line-through" : "none" }}>
                {item.text}
              </span>
            </label>
          ))}
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
                  <th key={`h-${i}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, ri) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: table rows have no stable id, position is the identity here
                <tr key={`r-${ri}`}>
                  {row.map((cell, ci) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: table cells have no stable id, position is the identity here
                    <td key={`c-${ri}-${ci}`}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    case "code": {
      const data = b.data as unknown as KnowledgeCodeData;
      return <pre className="crm-kb-code-block">{data.code}</pre>;
    }
    case "alert": {
      const data = b.data as unknown as KnowledgeAlertData;
      return <div className={`crm-kb-alert ${data.tone}`}>{data.text}</div>;
    }
    case "image": {
      const data = b.data as unknown as KnowledgeImageData;
      return <ImageBlockView data={data} />;
    }
    case "video": {
      const data = b.data as unknown as KnowledgeVideoData;
      if (!data.url) return null;
      return (
        <div>
          <a href={data.url} target="_blank" rel="noreferrer" className="crm-tag">
            {data.caption || "Assistir vídeo"}
          </a>
        </div>
      );
    }
    case "attachment": {
      const data = b.data as unknown as KnowledgeAttachmentData;
      return <AttachmentBlockView data={data} />;
    }
    case "link": {
      const data = b.data as unknown as KnowledgeLinkData;
      if (!data.url) return null;
      return (
        <a
          href={data.url}
          target="_blank"
          rel="noreferrer"
          style={{ display: "flex", gap: 6, alignItems: "center" }}
        >
          <IconLink2 size={14} /> {data.label || data.url}
        </a>
      );
    }
    default:
      return null;
  }
}

function ImageBlockView({ data }: { data: KnowledgeImageData }) {
  const [resolvedUrl, setResolvedUrl] = useState(data.url);

  useEffect(() => {
    if (data.url || !data.fileId) return;
    getKnowledgeFileDownloadUrlAction(data.fileId).then((result) => {
      if (result.url) setResolvedUrl(result.url);
    });
  }, [data.url, data.fileId]);

  if (!resolvedUrl) return null;
  return (
    <figure style={{ margin: 0 }}>
      {/* biome-ignore lint/performance/noImgElement: renders arbitrary stored/external URLs, not an optimizable local asset */}
      <img src={resolvedUrl} alt={data.caption} style={{ maxWidth: "100%", borderRadius: 10 }} />
      {data.caption && (
        <figcaption className="crm-card-sub" style={{ marginTop: 4 }}>
          {data.caption}
        </figcaption>
      )}
    </figure>
  );
}

function AttachmentBlockView({ data }: { data: KnowledgeAttachmentData }) {
  async function handleDownload() {
    const result = await getKnowledgeFileDownloadUrlAction(data.fileId);
    if (result.url) window.open(result.url, "_blank");
  }

  if (!data.fileId) return null;
  return (
    <button
      type="button"
      onClick={handleDownload}
      style={{
        display: "flex",
        gap: 8,
        alignItems: "center",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 0,
      }}
    >
      <IconPaperclip size={15} />
      <span style={{ fontSize: 13.5, textDecoration: "underline" }}>{data.fileName}</span>
    </button>
  );
}
