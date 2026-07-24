import type { KnowledgeCategoryColor } from "@/types/knowledge";

/** Mirrors the seed inserted by the Fase 18 migration — used so category
 * pickers and the demo-data layer always have a sensible list even before
 * the first real fetch resolves, same reasoning as
 * domain/financial/defaultCategories.ts. */
export const DEFAULT_KNOWLEDGE_CATEGORIES: {
  name: string;
  slug: string;
  icon: string;
  color: KnowledgeCategoryColor;
  sortOrder: number;
}[] = [
  { name: "Comercial", slug: "comercial", icon: "target", color: "info", sortOrder: 1 },
  { name: "Marketing", slug: "marketing", icon: "report", color: "warn", sortOrder: 2 },
  { name: "Financeiro", slug: "financeiro", icon: "wallet", color: "ok", sortOrder: 3 },
  { name: "Projetos", slug: "projetos", icon: "doc", color: "info", sortOrder: 4 },
  { name: "Operação", slug: "operacao", icon: "bolt", color: "neutral", sortOrder: 5 },
  { name: "RH", slug: "rh", icon: "users", color: "neutral", sortOrder: 6 },
  { name: "Tecnologia", slug: "tecnologia", icon: "server", color: "neutral", sortOrder: 7 },
  { name: "Jurídico", slug: "juridico", icon: "lock", color: "danger", sortOrder: 8 },
  { name: "Treinamentos", slug: "treinamentos", icon: "book", color: "ok", sortOrder: 9 },
];
