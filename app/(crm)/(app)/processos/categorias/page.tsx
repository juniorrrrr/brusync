import type { Metadata } from "next";
import { fetchProcessCategories } from "@/application/processes/processesQueries";
import { ProcessCategoriesClient } from "@/components/processes/ProcessCategoriesClient";

export const metadata: Metadata = {
  title: "Categorias — Processos — Brusync OS",
};

export default async function ProcessesCategoriesPage() {
  const categories = await fetchProcessCategories();
  return <ProcessCategoriesClient categories={categories} />;
}
