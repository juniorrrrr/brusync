/** Mirrors the seed inserted by the Fase 14 migration — used only so the
 * transaction form always has a sensible category list even before the
 * first real fetch resolves (and by the demo-data layer, which never
 * touches the database at all). */
export const DEFAULT_EXPENSE_CATEGORIES = [
  "Impostos",
  "Infraestrutura",
  "Marketing",
  "Terceiros",
  "Software",
  "Salários",
  "Outros",
];

export const DEFAULT_REVENUE_CATEGORIES = ["Receita de projeto", "Outras receitas"];
