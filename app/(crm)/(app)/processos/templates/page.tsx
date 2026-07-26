import type { Metadata } from "next";
import {
  fetchProcessCategories,
  fetchProcessTemplates,
} from "@/application/processes/processesQueries";
import { ProcessTemplatesClient } from "@/components/processes/ProcessTemplatesClient";

export const metadata: Metadata = {
  title: "Templates — Processos — Brusync OS",
};

export default async function ProcessesTemplatesPage() {
  const [templates, categories] = await Promise.all([
    fetchProcessTemplates(),
    fetchProcessCategories(),
  ]);

  return <ProcessTemplatesClient templates={templates} categories={categories} />;
}
