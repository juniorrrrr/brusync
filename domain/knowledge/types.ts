import type {
  KnowledgeCategoryColor,
  KnowledgeContentType,
  KnowledgeDocumentStatus,
  KnowledgeFileKind,
} from "@/types/knowledge";

export const KNOWLEDGE_CONTENT_TYPES: KnowledgeContentType[] = [
  "documento",
  "playbook",
  "checklist",
  "faq",
  "procedimento",
  "politica",
  "treinamento",
  "script_comercial",
  "template",
  "contrato",
  "arquivo",
  "link_externo",
  "video",
];

export const KNOWLEDGE_CONTENT_TYPE_LABEL: Record<KnowledgeContentType, string> = {
  documento: "Documento",
  playbook: "Playbook",
  checklist: "Checklist",
  faq: "FAQ",
  procedimento: "Procedimento",
  politica: "Política",
  treinamento: "Treinamento",
  script_comercial: "Script Comercial",
  template: "Template",
  contrato: "Contrato",
  arquivo: "Arquivo",
  link_externo: "Link Externo",
  video: "Vídeo",
};

export const KNOWLEDGE_STATUSES: KnowledgeDocumentStatus[] = [
  "rascunho",
  "em_revisao",
  "publicado",
  "arquivado",
];

export const KNOWLEDGE_STATUS_LABEL: Record<KnowledgeDocumentStatus, string> = {
  rascunho: "Rascunho",
  em_revisao: "Em revisão",
  publicado: "Publicado",
  arquivado: "Arquivado",
};

export function knowledgeStatusBadge(status: KnowledgeDocumentStatus): KnowledgeCategoryColor {
  switch (status) {
    case "publicado":
      return "ok";
    case "em_revisao":
      return "warn";
    case "arquivado":
      return "neutral";
    default:
      return "info";
  }
}

/** Status transitions allowed from the workflow UI — Rascunho -> Em revisão
 * -> Publicado -> Arquivado, plus the ability to reopen an Arquivado doc back
 * to Rascunho and to send a Publicado doc back to Em revisão for a fix. */
export const KNOWLEDGE_STATUS_TRANSITIONS: Record<
  KnowledgeDocumentStatus,
  KnowledgeDocumentStatus[]
> = {
  rascunho: ["em_revisao", "publicado"],
  em_revisao: ["rascunho", "publicado"],
  publicado: ["em_revisao", "arquivado"],
  arquivado: ["rascunho"],
};

export const KNOWLEDGE_FILE_KINDS: KnowledgeFileKind[] = [
  "imagem",
  "pdf",
  "docx",
  "planilha",
  "apresentacao",
  "zip",
  "video",
  "outro",
];

export const KNOWLEDGE_FILE_KIND_LABEL: Record<KnowledgeFileKind, string> = {
  imagem: "Imagem",
  pdf: "PDF",
  docx: "Word",
  planilha: "Planilha",
  apresentacao: "Apresentação",
  zip: "ZIP",
  video: "Vídeo",
  outro: "Outro",
};

const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "webp", "svg"];
const SHEET_EXTENSIONS = ["xls", "xlsx", "csv"];
const PRESENTATION_EXTENSIONS = ["ppt", "pptx", "key"];
const VIDEO_EXTENSIONS = ["mp4", "mov", "webm", "avi"];

export function knowledgeFileKindFromName(
  fileName: string,
  mimeType?: string | null,
): KnowledgeFileKind {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (mimeType?.startsWith("image/") || IMAGE_EXTENSIONS.includes(ext)) return "imagem";
  if (mimeType?.startsWith("video/") || VIDEO_EXTENSIONS.includes(ext)) return "video";
  if (mimeType === "application/pdf" || ext === "pdf") return "pdf";
  if (ext === "zip" || ext === "rar" || ext === "7z") return "zip";
  if (ext === "doc" || ext === "docx") return "docx";
  if (SHEET_EXTENSIONS.includes(ext)) return "planilha";
  if (PRESENTATION_EXTENSIONS.includes(ext)) return "apresentacao";
  return "outro";
}

export const KNOWLEDGE_CATEGORY_COLORS: KnowledgeCategoryColor[] = [
  "info",
  "warn",
  "ok",
  "neutral",
  "danger",
];

/** Turns a category/tag display name into the URL-safe slug the DB unique
 * index expects — mirrors how document slugs are derived from title. */
// Combining diacritical marks block (U+0300–U+036F), built from char codes
// to avoid embedding literal combining characters in source.
const COMBINING_MARKS_START = String.fromCharCode(0x0300);
const COMBINING_MARKS_END = String.fromCharCode(0x036f);
const DIACRITICS_PATTERN = new RegExp(`[${COMBINING_MARKS_START}-${COMBINING_MARKS_END}]`, "g");

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(DIACRITICS_PATTERN, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
