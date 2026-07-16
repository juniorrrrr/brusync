export type PdfBlock =
  | { type: "cover"; category: string; title: string; subtitle: string }
  | { type: "toc"; entries: { title: string; page: number }[] }
  | { type: "divider"; number: string; title: string; intro: string }
  | { type: "content"; heading: string; paragraphs: string[]; bullets?: string[] }
  | { type: "stat"; heading: string; items: { value: string; label: string }[] }
  | { type: "checklist"; heading: string; intro?: string; items: string[] }
  | { type: "quote"; text: string; author: string }
  | { type: "flow"; heading: string; steps: string[] }
  | { type: "chart"; heading: string; caption: string; bars: { label: string; value: number }[] }
  | { type: "closing"; heading: string; text: string };

export interface PdfDocumentData {
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  blocks: PdfBlock[];
}
