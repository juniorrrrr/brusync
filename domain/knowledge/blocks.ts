import type { KnowledgeBlock } from "@/types/knowledge";

export type KnowledgeBlockType = KnowledgeBlock["type"];

export const KNOWLEDGE_BLOCK_TYPES: KnowledgeBlockType[] = [
  "heading",
  "subheading",
  "paragraph",
  "list",
  "checklist",
  "table",
  "code",
  "alert",
  "image",
  "video",
  "attachment",
  "link",
];

export const KNOWLEDGE_BLOCK_LABEL: Record<KnowledgeBlockType, string> = {
  heading: "Título",
  subheading: "Subtítulo",
  paragraph: "Texto",
  list: "Lista",
  checklist: "Checklist",
  table: "Tabela",
  code: "Código",
  alert: "Alerta",
  image: "Imagem",
  video: "Vídeo",
  attachment: "Anexo",
  link: "Link",
};

export type KnowledgeAlertTone = "info" | "warn" | "ok" | "danger";

export interface KnowledgeHeadingData {
  text: string;
}
export interface KnowledgeSubheadingData {
  text: string;
}
export interface KnowledgeParagraphData {
  text: string;
}
export interface KnowledgeListData {
  ordered: boolean;
  items: string[];
}
export interface KnowledgeChecklistData {
  items: { text: string; done: boolean }[];
}
export interface KnowledgeTableData {
  headers: string[];
  rows: string[][];
}
export interface KnowledgeCodeData {
  language: string;
  code: string;
}
export interface KnowledgeAlertData {
  tone: KnowledgeAlertTone;
  text: string;
}
export interface KnowledgeImageData {
  fileId: string | null;
  url: string;
  caption: string;
}
export interface KnowledgeVideoData {
  url: string;
  caption: string;
}
export interface KnowledgeAttachmentData {
  fileId: string;
  fileName: string;
}
export interface KnowledgeLinkData {
  url: string;
  label: string;
}

let blockIdSeq = 0;

/** crypto.randomUUID is unavailable during SSR module init in some runtimes,
 * so block ids use a monotonic counter + timestamp instead — they only need
 * to be unique within a single editing session, never persisted as a real
 * identifier. */
export function createBlockId(): string {
  blockIdSeq += 1;
  return `blk-${Date.now().toString(36)}-${blockIdSeq}`;
}

export function createEmptyBlock(type: KnowledgeBlockType): KnowledgeBlock {
  const id = createBlockId();
  switch (type) {
    case "heading":
      return { id, type, data: { text: "" } satisfies KnowledgeHeadingData };
    case "subheading":
      return { id, type, data: { text: "" } satisfies KnowledgeSubheadingData };
    case "paragraph":
      return { id, type, data: { text: "" } satisfies KnowledgeParagraphData };
    case "list":
      return { id, type, data: { ordered: false, items: [""] } satisfies KnowledgeListData };
    case "checklist":
      return {
        id,
        type,
        data: { items: [{ text: "", done: false }] } satisfies KnowledgeChecklistData,
      };
    case "table":
      return {
        id,
        type,
        data: { headers: ["Coluna 1", "Coluna 2"], rows: [["", ""]] } satisfies KnowledgeTableData,
      };
    case "code":
      return { id, type, data: { language: "text", code: "" } satisfies KnowledgeCodeData };
    case "alert":
      return { id, type, data: { tone: "info", text: "" } satisfies KnowledgeAlertData };
    case "image":
      return {
        id,
        type,
        data: { fileId: null, url: "", caption: "" } satisfies KnowledgeImageData,
      };
    case "video":
      return { id, type, data: { url: "", caption: "" } satisfies KnowledgeVideoData };
    case "attachment":
      return { id, type, data: { fileId: "", fileName: "" } satisfies KnowledgeAttachmentData };
    case "link":
      return { id, type, data: { url: "", label: "" } satisfies KnowledgeLinkData };
    default:
      return { id, type: "paragraph", data: { text: "" } satisfies KnowledgeParagraphData };
  }
}

/** Flattens a document's blocks into plain text — the only place
 * content_text (and therefore the search_vector generated column) is
 * derived from. Called by the documents repository right before every
 * insert/update, never stored redundantly anywhere else. */
export function extractPlainText(blocks: KnowledgeBlock[]): string {
  const parts: string[] = [];
  for (const block of blocks) {
    switch (block.type) {
      case "heading":
      case "subheading":
      case "paragraph":
        parts.push(String((block.data as unknown as KnowledgeParagraphData).text ?? ""));
        break;
      case "list":
        parts.push(...(block.data as unknown as KnowledgeListData).items);
        break;
      case "checklist":
        parts.push(
          ...(block.data as unknown as KnowledgeChecklistData).items.map((item) => item.text),
        );
        break;
      case "table": {
        const table = block.data as unknown as KnowledgeTableData;
        parts.push(...table.headers, ...table.rows.flat());
        break;
      }
      case "code":
        parts.push((block.data as unknown as KnowledgeCodeData).code ?? "");
        break;
      case "alert":
        parts.push((block.data as unknown as KnowledgeAlertData).text ?? "");
        break;
      case "image":
        parts.push((block.data as unknown as KnowledgeImageData).caption ?? "");
        break;
      case "video":
        parts.push((block.data as unknown as KnowledgeVideoData).caption ?? "");
        break;
      case "attachment":
        parts.push((block.data as unknown as KnowledgeAttachmentData).fileName ?? "");
        break;
      case "link":
        parts.push((block.data as unknown as KnowledgeLinkData).label ?? "");
        break;
      default:
        break;
    }
  }
  return parts.filter(Boolean).join(" \n ");
}
